import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageLinkTypeEnum } from '@/common/model'
import { deployment } from '@/components/deploy-status-bar/deploy-status-bar.util'
import { useImageLinkSource } from '@/composables/use-image-link-source'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { validateLinkRule } from '@/utils/link-rule-validation'
import { createRepositoryFixture, createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'

vi.mock('@/components/deploy-status-bar/deploy-status-bar.util', () => ({ deployment: { check: vi.fn() } }))
const store = usePicxStore(pinia)
beforeEach(() => {
  localStorage.clear()
  store.$reset()
  store.SET_USER_SETTINGS(createSettingsFixture())
  Object.assign(store.getUserConfigInfo, createRepositoryFixture())
  vi.mocked(deployment.check).mockReset()
})
describe('规则编辑与旧数据边界', () => {
  it('内置规则禁止修改模板或名称，即使提交 editable 也不能解锁', () => {
    const settingsBefore = JSON.stringify(store.getUserSettings)
    const localBefore = localStorage.getItem('PICX_IH_SETTINGS')
    const builtInRules = Object.values(store.getUserSettings.imageLinkType.presetList).filter(rule => !rule.editable)
    expect(builtInRules).toHaveLength(5)
    for (const rule of builtInRules) {
      const changed = { ...rule, rule: 'https://changed.example.test/{{path}}', editable: true }
      expect(store.SAVE_IMAGE_LINK_RULE(changed, rule.name)).toBe(false)
      expect(store.SAVE_IMAGE_LINK_RULE({ ...changed, name: `${rule.name} renamed` }, rule.name)).toBe(false)
      store.UPDATE_IMAGE_LINK_TYPE_RULE({ rule: changed })
    }
    expect(JSON.stringify(store.getUserSettings)).toBe(settingsBefore)
    expect(localStorage.getItem('PICX_IH_SETTINGS')).toBe(localBefore)
  })

  it('名称、重复、path、变量、协议与凭据 URL 校验', () => {
    const rules = store.getUserSettings.imageLinkType.presetList
    const rule = { name: 'New CDN', rule: 'https://cdn.example.test/{{path}}' }
    expect(validateLinkRule(rule, rules)).toBeNull()
    expect(validateLinkRule({ ...rule, name: '' }, rules)).toBe('name-required')
    expect(validateLinkRule({ ...rule, name: 'fixture cdn' }, rules)).toBe('name-duplicate')
    expect(validateLinkRule({ ...rule, name: '__proto__' }, rules)).toBe('name-invalid')
    expect(validateLinkRule({ ...rule, rule: 'https://cdn.example.test/no-path' }, rules)).toBe('path-required')
    expect(validateLinkRule({ ...rule, rule: 'https://cdn.example.test/{{other}}/{{path}}' }, rules)).toBe('variable-invalid')
    expect(validateLinkRule({ ...rule, rule: 'javascript:{{path}}' }, rules)).toBe('protocol-invalid')
    expect(validateLinkRule({ ...rule, rule: 'https://user:pass@example.test/{{path}}' }, rules)).toBe('url-invalid')
  })
  it('旧模板读取不变、内置来源 / 格式完整；编辑 id 稳定，预设不能删除', () => {
    const before = createSettingsFixture()
    expect(store.getUserSettings.imageLinkType.presetList['Fixture CDN']).toEqual(before.imageLinkType.presetList['Fixture CDN'])
    expect(store.getUserSettings.imageLinkType.presetList.GitHub).toBeDefined()
    expect(store.getUserSettings.imageLinkFormat.presetList.map(format => format.name)).toEqual(['Markdown', 'HTML', 'BBCode'])
    const old = store.getUserSettings.imageLinkType.presetList['Fixture CDN']
    expect(store.SAVE_IMAGE_LINK_RULE({ ...old, name: 'Renamed', rule: 'https://cdn.example.test/{{path}}' }, old.name)).toBe(true)
    expect(store.getUserSettings.imageLinkType.selected).toBe('Renamed')
    expect(store.getUserSettings.imageLinkType.presetList.Renamed.id).toBe(old.id)
    expect(store.REMOVE_IMAGE_LINK_RULE(store.getUserSettings.imageLinkType.presetList.GitHub)).toBe(false)
    expect(store.REMOVE_IMAGE_LINK_RULE(store.getUserSettings.imageLinkType.presetList.Renamed)).toBe(true)
    expect(store.getUserSettings.imageLinkType.selected).toBe('GitHub')
  })
})
describe('pages 来源选择事务', () => {
  it('未知 / 等待保留旧来源，可用后才提交', async () => {
    const source = useImageLinkSource()
    vi.mocked(deployment.check).mockResolvedValue({ phase: 'waiting', operationId: 1, target: fixtureRepository, commitSha: 'fixture-sha' })
    await source.select(ImageLinkTypeEnum.GitHubPages)
    expect(store.getUserSettings.imageLinkType.selected).toBe('Fixture CDN')
    expect(source.error.value).toBe('link_rules.pages-unavailable')
    vi.mocked(deployment.check).mockResolvedValue({ phase: 'available', operationId: 1, target: fixtureRepository, commitSha: 'fixture-sha', evidence: 'pages-build', url: 'https://images.example.test/', checkedAt: 1 })
    await source.select(ImageLinkTypeEnum.GitHubPages)
    expect(store.getUserSettings.imageLinkType.selected).toBe(ImageLinkTypeEnum.GitHubPages)
  })
  it('晚到成功不能覆盖后续普通来源选择', async () => {
    let finish: (value: Awaited<ReturnType<typeof deployment.check>>) => void = () => {}
    vi.mocked(deployment.check).mockReturnValue(new Promise((resolve) => {
      finish = resolve
    }))
    const source = useImageLinkSource()
    const pending = source.select(ImageLinkTypeEnum.GitHubPages)
    await source.select(ImageLinkTypeEnum.GitHub)
    finish({ phase: 'available', operationId: 1, target: fixtureRepository, commitSha: 'fixture-sha', evidence: 'pages-build', url: 'https://images.example.test/', checkedAt: 1 })
    await pending
    expect(store.getUserSettings.imageLinkType.selected).toBe(ImageLinkTypeEnum.GitHub)
  })
})
