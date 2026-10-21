import { onScopeDispose } from 'vue'
import { workspaceInputBlocked } from '@/utils/workspace-input'

export function useDeploymentShortcut(enabled: () => boolean, run: () => void) {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.shiftKey || !document.hasFocus()
      || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'd' || workspaceInputBlocked(event.target) || !enabled()) {
      return
    }
    event.preventDefault()
    run()
  }
  document.addEventListener('keydown', onKeydown)
  onScopeDispose(() => document.removeEventListener('keydown', onKeydown))
}
