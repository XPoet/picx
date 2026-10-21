import type { DirectoryQueryState } from '@/common/model/repository-directory'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { getDirInfoListResult } from '@/common/api/dir'
import RepoDirCascader from '@/components/repo-dir-cascader/repo-dir-cascader.vue'
import { useRepositoryDirectories } from '@/composables/use-repository-directories'
import i18n from '@/plugins/vue/i18n'

vi.mock('@/common/api/dir', () => ({ getDirInfoListResult: vi.fn() }))
const global = { mocks: { $t: i18n.global.t } }
const repository = { owner: 'fixture-owner', repo: 'media', branch: 'custom' }
const option = (segments: string[]) => ({ name: segments.at(-1) ?? '', segments, leaf: segments.length >= 5 })
const loaded = (paths: string[][]): DirectoryQueryState => ({ phase: 'loaded', items: paths.map(option) })

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe('受控目录选择器', () => {
  it('选择父目录与展开下级是独立事件，受控实例不持久化', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const wrapper = mount(RepoDirCascader, { props: { controlled: true, modelValue: [], loads: { '/': loaded([['albums']]) } }, global })
    expect(wrapper.emitted('requestChildren')).toEqual([[[]]])
    await wrapper.get('.directory-select').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['albums']]])
    expect(wrapper.emitted('requestChildren')).toHaveLength(1)
    await wrapper.get('.directory-expand').trigger('click')
    expect(wrapper.emitted('requestChildren')?.at(-1)).toEqual([['albums']])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(write).not.toHaveBeenCalled()
  })

  it('刷新与加载失败保留草稿和已有条目，失败和空目录不同', async () => {
    const wrapper = mount(RepoDirCascader, { props: { controlled: true, modelValue: ['albums'], loads: { '/': loaded([['albums']]) } }, global })
    await wrapper.get('.directory-selector-toolbar button').trigger('click')
    expect(wrapper.emitted('retry')).toEqual([[[]]])
    await wrapper.setProps({ loads: { '/': { phase: 'failed', error: { kind: 'network', retryable: true }, items: [option(['albums'])] } } })
    expect(wrapper.find('[role="alert"]').text()).toContain('网络请求失败')
    expect(wrapper.get('.directory-select').attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ loads: { '/': loaded([]) } })
    expect(wrapper.text()).toContain('此目录没有子目录')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('第五层可选择但不能展开第六层，禁用状态阻止选择', async () => {
    const segments = ['a', 'b', 'c', 'd', 'e']
    const wrapper = mount(RepoDirCascader, { props: { controlled: true, modelValue: segments, loads: { 'a/b/c/d': loaded([segments]) } }, global })
    await nextTick()
    const last = wrapper.findAll('.directory-column').at(-1)
    expect(last?.find('.directory-expand').exists()).toBe(false)
    await last?.get('.directory-select').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([segments])
    await wrapper.setProps({ disabled: true })
    await last?.get('.directory-select').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })
})

describe('目录查询会话', () => {
  it('逐级查询只改变数据，不改变选择；五层禁止继续查询', async () => {
    const hook = useRepositoryDirectories(repository)
    vi.mocked(getDirInfoListResult).mockResolvedValueOnce({ ok: true, data: [{ value: 'albums', label: 'albums' }] })
    hook.beginSession()
    await hook.loadChildren([])
    expect(hook.loads.value['/']).toEqual(loaded([['albums']]))
    await hook.loadChildren(['a', 'b', 'c', 'd', 'e'])
    expect(getDirInfoListResult).toHaveBeenCalledTimes(1)
  })

  it('同层防重，刷新失败保留已有列表，重试空目录独立显示', async () => {
    const hook = useRepositoryDirectories(repository)
    vi.mocked(getDirInfoListResult).mockResolvedValueOnce({ ok: true, data: [{ value: 'albums', label: 'albums' }] })
    await hook.loadChildren([])
    vi.mocked(getDirInfoListResult).mockResolvedValueOnce({ ok: false, error: { kind: 'forbidden', status: 403, retryable: false } })
    await hook.loadChildren([], true)
    expect(hook.loads.value['/']).toMatchObject({ phase: 'failed', items: [option(['albums'])] })
    vi.mocked(getDirInfoListResult).mockResolvedValueOnce({ ok: true, data: [] })
    await hook.loadChildren([], true)
    expect(hook.loads.value['/']).toEqual(loaded([]))
  })

  it('关闭再打开后，旧请求的迟到响应不能覆盖新会话', async () => {
    const hook = useRepositoryDirectories(repository)
    let resolveOld: (value: Awaited<ReturnType<typeof getDirInfoListResult>>) => void = () => {}
    vi.mocked(getDirInfoListResult).mockImplementationOnce(() => new Promise((resolve) => {
      resolveOld = resolve
    }))
    hook.beginSession()
    const old = hook.loadChildren([])
    await hook.loadChildren([])
    expect(getDirInfoListResult).toHaveBeenCalledTimes(1)
    hook.endSession()
    hook.beginSession()
    vi.mocked(getDirInfoListResult).mockResolvedValueOnce({ ok: true, data: [{ value: 'new', label: 'new' }] })
    await hook.loadChildren([])
    resolveOld({ ok: true, data: [{ value: 'old', label: 'old' }] })
    await old
    expect(hook.loads.value['/']).toEqual(loaded([['new']]))
  })

  it('乱序层级响应互不覆盖，切换仓库后旧响应无效', async () => {
    const identity = ref({ ...repository })
    const hook = useRepositoryDirectories(identity)
    let finishRoot: (value: Awaited<ReturnType<typeof getDirInfoListResult>>) => void = () => {}
    vi.mocked(getDirInfoListResult).mockImplementationOnce(() => new Promise((resolve) => {
      finishRoot = resolve
    }))
    const root = hook.loadChildren([])
    vi.mocked(getDirInfoListResult).mockResolvedValueOnce({ ok: true, data: [{ value: '2026', label: '2026' }] })
    await hook.loadChildren(['albums'])
    finishRoot({ ok: true, data: [] })
    await root
    expect(hook.loads.value.albums).toEqual(loaded([['albums', '2026']]))
    expect(hook.loads.value['/']).toEqual(loaded([]))
    vi.mocked(getDirInfoListResult).mockImplementationOnce(() => new Promise((resolve) => {
      finishRoot = resolve
    }))
    const outdated = hook.loadChildren([], true)
    identity.value.repo = 'new-repository'
    finishRoot({ ok: true, data: [{ value: 'old', label: 'old' }] })
    await outdated
    expect(hook.loads.value['/']).toBeUndefined()
    vi.mocked(getDirInfoListResult).mockResolvedValueOnce({ ok: true, data: [] })
    await hook.loadChildren([])
    expect(hook.loads.value['/']).toEqual(loaded([]))
  })
})
