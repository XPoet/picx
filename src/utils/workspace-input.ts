/** 文本编辑、弹窗和媒体预览保留浏览器自己的粘贴及快捷键。 */
export function workspaceInputBlocked(target: EventTarget | null): boolean {
  if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"]'))
    return true
  return [...document.querySelectorAll('[role="dialog"], .el-image-viewer__wrapper')].some((element) => {
    for (let current: Element | null = element; current; current = current.parentElement) {
      if (current.hasAttribute('hidden') || current.getAttribute('aria-hidden') === 'true' || getComputedStyle(current).display === 'none')
        return false
    }
    return true
  })
}
