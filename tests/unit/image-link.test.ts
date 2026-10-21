import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearCopyFailure, copyFailureText } from '@/composables/use-copy-feedback'
import { copyText } from '@/utils/common-utils'
import { formatImageLink, imageLinkText, resolveImageLink, successLinkText } from '@/utils/image-link-utils'
import { createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'

afterEach(() => {
  clearCopyFailure()
  vi.unstubAllGlobals()
})
describe('规则、预览和复制格式', () => {
  it.each([
    'https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}',
    'https://{{owner}}.github.io/{{repo}}/{{path}}',
    'https://cdn.example.test/{{owner}}/{{repo}}@{{branch}}/{{path}}',
    'https://custom.example.test/{{path}}?owner={{owner}}&ref={{branch}}',
  ])('来源 %s 使用同一替换规则', (rule) => {
    const link = resolveImageLink(rule, fixtureRepository, '相 册/a#?.png')
    expect(link).toContain('%E7%9B%B8%20%E5%86%8C/a%23%3F.png')
    expect(link).not.toContain('{{')
  })
  it('重复变量、名称中的变量字面值和非法规则安全处理', () => {
    expect(resolveImageLink('https://example.test/{{path}}?path={{path}}', fixtureRepository, 'imageLink.png')).toBe('https://example.test/imageLink.png?path=imageLink.png')
    for (const rule of ['', 'javascript:alert(1)', 'https://example.test/{{unknown}}'])
      expect(resolveImageLink(rule, fixtureRepository, 'a.png')).toBeNull()
    const settings = createSettingsFixture().imageLinkFormat
    settings.enable = true
    settings.selected = 'Markdown'
    settings.presetList = [{ name: 'Markdown', format: '![imageName](imageLink)' }]
    expect(formatImageLink('https://example.test/imageName.png', 'a.imageLink.png', settings)).toBe('![a.imageLink](https://example.test/imageName.png)')
  })
  it.each([
    ['Markdown', '![imageName](imageLink)', '![a.b](https://example.test/a.png)'],
    ['HTML', '<img src="imageLink" alt="imageName" />', '<img src="https://example.test/a.png" alt="a.b" />'],
    ['BBCode', '[img]imageLink[/img]', '[img]https://example.test/a.png[/img]'],
  ])('%s 与原始 URL 保持预览 / 复制一致', (selected, format, expected) => {
    const preferences = { enable: true, selected, presetList: [{ name: selected, format }] }
    expect(formatImageLink('https://example.test/a.png', 'a.b.png', preferences)).toBe(expected)
    preferences.enable = false
    expect(formatImageLink('https://example.test/a.png', 'a.b.png', preferences)).toBe('https://example.test/a.png')
    expect(formatImageLink(null, 'a.png', preferences)).toBe('')
  })
  it('成功集使用各项实际目标，空或损坏规则不会出现 null 链接', () => {
    const settings = createSettingsFixture()
    expect(successLinkText([], settings)).toBe('')
    expect(imageLinkText({ name: 'a.png', path: 'first/a.png' }, fixtureRepository, settings)).toContain('/master/first/a.png')
    settings.imageLinkType.selected = 'missing'
    expect(imageLinkText({ name: 'a.png', path: 'first/a.png' }, fixtureRepository, settings)).toBe('')
  })
})
describe('显式剪贴板结果', () => {
  it('拒绝时保留纯文本，重试成功清理反馈，成功回调只执行一次', async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError')).mockResolvedValueOnce(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const callback = vi.fn()
    const text = '<img src="unsafe-template" />'
    await expect(copyText(text, callback)).resolves.toEqual({ ok: false, reason: 'denied', text })
    expect(callback).not.toHaveBeenCalled()
    expect(copyFailureText.value).toBe(text)
    await expect(copyText(text, callback)).resolves.toEqual({ ok: true })
    expect(copyFailureText.value).toBeNull()
    expect(callback).toHaveBeenCalledTimes(1)
  })
  it('浏览器无剪贴板 API 返回 unavailable', async () => {
    vi.stubGlobal('navigator', {})
    await expect(copyText('text')).resolves.toEqual({ ok: false, reason: 'unavailable', text: 'text' })
  })
})
