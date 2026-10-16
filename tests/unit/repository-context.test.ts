import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RepositoryContextBar from '@/components/repository-context-bar/repository-context-bar.vue'
import i18n from '@/plugins/vue/i18n'

const repository = { owner: 'fixture-owner', repo: 'media', branch: 'custom-branch' }
const global = { mocks: { $t: i18n.global.t } }

describe('无凭据仓库上下文', () => {
  it('已保存配置不能冒充连接或公开可见性', () => {
    const wrapper = mount(RepositoryContextBar, { props: { repository, uploadPath: '/albums/2026', connection: { phase: 'disconnected' } }, global })
    expect(wrapper.text()).toContain('连接待验证')
    expect(wrapper.text()).toContain('尚未确认仓库可见性')
    expect(wrapper.text()).not.toContain('GitHub 已连接')
  })

  it.each(['public', 'private'] as const)('可见性 %s 来自匹配仓库的成功验证', (visibility) => {
    const wrapper = mount(RepositoryContextBar, { props: { repository, uploadPath: '/', connection: { phase: 'connected', attemptId: 1, repository, visibility, verifiedAt: 1 } }, global })
    expect(wrapper.text()).toContain('GitHub 已连接')
    expect(wrapper.text()).toContain(visibility === 'public' ? '可被公开访问' : '文件访问取决于仓库权限')
  })

  it.each([
    ['offline', '当前离线'],
    ['unauthenticated', '凭据已失效'],
    ['forbidden', '仓库访问权限不足'],
  ] as const)('失败 %s 提供重连事件', async (kind, label) => {
    const wrapper = mount(RepositoryContextBar, { props: { repository, uploadPath: '/saved', connection: { phase: 'failed', attemptId: 2, error: { kind, retryable: true } } }, global })
    expect(wrapper.text()).toContain(label)
    await wrapper.get('.reconnect-button').trigger('click')
    expect(wrapper.emitted('reconnect')).toEqual([[]])
    expect(wrapper.get('summary').text()).toBe('/saved')
  })

  it('连接中不重复重连，配置按钮发出事件；其他仓库的状态不用于当前仓库', async () => {
    const wrapper = mount(RepositoryContextBar, { props: { repository, uploadPath: '/saved', connection: { phase: 'validating', attemptId: 1 } }, global })
    expect(wrapper.text()).toContain('正在连接 GitHub')
    expect(wrapper.find('.reconnect-button').exists()).toBe(false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('configure')).toEqual([[]])
    await wrapper.setProps({ connection: { phase: 'connected', attemptId: 2, repository: { ...repository, repo: 'other' }, visibility: 'public', verifiedAt: 1 } })
    expect(wrapper.text()).not.toContain('GitHub 已连接')
    expect(wrapper.text()).toContain('尚未确认仓库可见性')
  })
})
