import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useDeploymentShortcut } from '@/composables/use-deployment-shortcut'

const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))
function press(target: EventTarget = document.body, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, cancelable: true, bubbles: true, ...options })
  target.dispatchEvent(event)
  return event.defaultPrevented
}
describe('部署唯一快捷键', () => {
  it('按钮禁用、输入 / 弹窗、重复和失焦不接管，卸载移除监听', () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    let enabled = false
    const run = vi.fn()
    const scope = effectScope()
    scopes.push(scope)
    scope.run(() => useDeploymentShortcut(() => enabled, run))
    expect(press()).toBe(false)
    enabled = true
    const input = document.createElement('input')
    document.body.append(input)
    expect(press(input)).toBe(false)
    input.remove()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.append(dialog)
    expect(press()).toBe(false)
    dialog.remove()
    for (const options of [{ repeat: true }, { isComposing: true }, { shiftKey: true }, { altKey: true }])
      expect(press(document.body, options)).toBe(false)
    expect(press()).toBe(true)
    expect(run).toHaveBeenCalledTimes(1)
    vi.mocked(document.hasFocus).mockReturnValue(false)
    expect(press()).toBe(false)
    scope.stop()
    vi.mocked(document.hasFocus).mockReturnValue(true)
    expect(press()).toBe(false)
  })
})
