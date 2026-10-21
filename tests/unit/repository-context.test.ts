import { enableAutoUnmount, mount } from '@vue/test-utils'
import { ElButton } from 'element-plus'
import { afterEach, describe, expect, it } from 'vitest'
import RepositoryContextBar from '@/components/repository-context-bar/repository-context-bar.vue'
import i18n from '@/plugins/vue/i18n'

const repository = { owner: 'fixture-owner', repo: 'media', branch: 'custom-branch' }
const global = { mocks: { $t: i18n.global.t }, components: { ElButton } }

enableAutoUnmount(afterEach)

describe('仓库上下文', () => {
  it('连接后回显仓库、分支和路径，断开后隐藏目录入口', async () => {
    const wrapper = mount(RepositoryContextBar, { props: { repository: null, uploadPath: '/' }, global })
    expect(wrapper.text()).toContain('尚未连接 GitHub 仓库')
    expect(wrapper.find('.change-directory-button').exists()).toBe(false)
    await wrapper.setProps({ repository, uploadPath: '/albums/2026' })
    expect(wrapper.get('.repository-name').text()).toBe('fixture-owner/media')
    expect(wrapper.get('.repository-name').attributes('href')).toBe('https://github.com/fixture-owner/media')
    expect(wrapper.get('.repository-branch').text()).toBe('custom-branch')
    expect(wrapper.get('.repository-directory').text()).toBe('/albums/2026')
    expect(wrapper.get('.change-directory-button').text()).toBe('更改上传目录')
    await wrapper.setProps({ repository: null })
    expect(wrapper.find('.change-directory-button').exists()).toBe(false)
  })

  it('点击更改上传目录发出配置事件', async () => {
    const wrapper = mount(RepositoryContextBar, { props: { repository, uploadPath: '/' }, global })
    const button = wrapper.get('button')
    expect(button.text()).toBe('更改上传目录')
    await button.trigger('click')
    expect(wrapper.emitted('configure')).toEqual([[]])
  })

  it('禁用时不能更改上传目录', async () => {
    const wrapper = mount(RepositoryContextBar, { props: { repository, uploadPath: '/', disabled: true }, global })
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.emitted('configure')).toBeUndefined()
  })
})
