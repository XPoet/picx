import type { Directive } from 'vue'
import type { UploadedImageModel } from '@/common/model'
import i18n from '@/plugins/vue/i18n'
import { copyManagementLinks, deleteMediaWithConfirmation, editDirectory, managementBusy, openManagementRepository, openMediaMove, renameMedia, showMediaProperties, uploadToManagementDirectory } from '@/services/management-actions'
import { store } from '@/stores'
import { ContextmenuEnum } from './types'

interface ContextValue { type: ContextmenuEnum, dir?: string, img?: UploadedImageModel }
interface ContextState { value: ContextValue, handler: (event: MouseEvent) => void }
const states = new WeakMap<HTMLElement, ContextState>()
let closeActive: (() => void) | null = null

function openContext(event: MouseEvent, value: ContextValue, trigger: HTMLElement) {
  event.preventDefault()
  event.stopPropagation()
  closeActive?.()
  const menu = document.createElement('div')
  menu.className = 'custom-contextmenu-container management-context-menu'
  menu.setAttribute('role', 'menu')
  menu.style.position = 'fixed'
  menu.style.zIndex = 'var(--picx-layer-overlay)'
  const currentPath = store.getters.getUserViewDir || '/'
  const directory = value.dir ? `${currentPath === '/' ? '' : `${currentPath}/`}${value.dir}` : currentPath
  const entries: Array<{ label: string, run: () => unknown }> = []
  const t = i18n.global.t
  if (value.type === ContextmenuEnum.img && value.img) {
    const image = value.img
    entries.push(
      { label: t('management_page.workspace.copyLink'), run: () => copyManagementLinks([image]) },
      { label: t('management_page.workspace.property'), run: () => showMediaProperties(image) },
      { label: t('rename'), run: () => renameMedia(image) },
      { label: t('move'), run: () => openMediaMove(image) },
      { label: t('delete'), run: () => deleteMediaWithConfirmation([image]) },
      { label: t('management_page.workspace.repository'), run: () => openManagementRepository(image.dir) },
    )
  }
  else if (value.type === ContextmenuEnum.uploadArea) {
    entries.push({ label: t('paste_image'), run: () => store.commit('SET_UPLOAD_AREA_STATE', { isPaste: true }) })
  }
  else {
    entries.push(
      { label: t('management_page.workspace.uploadCurrent'), run: () => uploadToManagementDirectory(directory) },
      { label: t('management_page.workspace.repository'), run: () => openManagementRepository(directory) },
    )
    if (value.type === ContextmenuEnum.dir && directory !== '/') {
      entries.push(
        { label: t('rename'), run: () => editDirectory(directory, 'rename') },
        { label: t('management_page.workspace.deleteDirectory'), run: () => editDirectory(directory, 'delete') },
      )
    }
  }
  function close() {
    menu.remove()
    document.removeEventListener('pointerdown', outside, true)
    document.removeEventListener('keydown', keyboard)
    window.removeEventListener('blur', close)
    window.removeEventListener('resize', close)
    if (closeActive === close)
      closeActive = null
  }
  function outside(pointer: PointerEvent) {
    if (pointer.target instanceof Node && !menu.contains(pointer.target))
      close()
  }
  function keyboard(key: KeyboardEvent) {
    const buttons = [...menu.querySelectorAll('button')]
    const index = buttons.findIndex(button => button === document.activeElement)
    if (key.key === 'Escape' || key.key === 'Tab') {
      close()
      if (key.key === 'Escape') {
        key.preventDefault()
        trigger.querySelector<HTMLElement>('button')?.focus()
      }
    }
    else if (key.key === 'ArrowDown' || key.key === 'ArrowUp') {
      key.preventDefault()
      buttons[(index + (key.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus()
    }
  }
  for (const entry of entries) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'custom-contextmenu-item'
    button.setAttribute('role', 'menuitem')
    button.textContent = entry.label
    button.disabled = managementBusy.value
    button.addEventListener('click', () => {
      close()
      if (!managementBusy.value)
        void entry.run()
    })
    menu.appendChild(button)
  }
  document.body.appendChild(menu)
  menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 8))}px`
  menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 8))}px`
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('keydown', keyboard)
  window.addEventListener('blur', close)
  window.addEventListener('resize', close)
  closeActive = close
  menu.querySelector('button')?.focus()
}

const contextmenuDirective: Directive<HTMLElement, ContextValue> = {
  mounted(element, binding) {
    const state: ContextState = { value: binding.value, handler: event => openContext(event, state.value, element) }
    states.set(element, state)
    element.addEventListener('contextmenu', state.handler)
  },
  updated(element, binding) {
    const state = states.get(element)
    if (state)
      state.value = binding.value
  },
  unmounted(element) {
    const state = states.get(element)
    if (state)
      element.removeEventListener('contextmenu', state.handler)
    states.delete(element)
    closeActive?.()
  },
}

export default contextmenuDirective
