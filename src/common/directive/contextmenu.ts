import { computed, Directive } from 'vue'
import router from '@/router'
import { store } from '@/stores'
import { ContextmenuEnum, DirModeEnum } from '@/common/model'
import { copyImageLink } from '@/utils'
import i18n from '@/plugins/vue/i18n'

const menuClass = 'custom-contextmenu-container'
let menuEle: any = null
let isAddEventListenerOfContextmenu: boolean = false

const contextmenuDirective: Directive = {
  mounted(el: any, binding: any) {
    el.addEventListener('contextmenu', (e: any) => {
      const { dir, type, img } = binding.value

      e.preventDefault()
      e.stopPropagation()

      const viewDir = computed(() => store.getters.getUserViewDir).value

      const selectedDir = dir ? `${viewDir === '/' ? '' : `${viewDir}/`}${dir}` : viewDir

      menuEle = document.querySelector(`.${menuClass}`)

      if (!menuEle) {
        menuEle = document.createElement('ul')
        menuEle.setAttribute('class', menuClass)
        menuEle.style.position = 'fixed'
        menuEle.style.zIndex = '1000'
        menuEle.innerHTML = `<li class="custom-contextmenu-item upload-image"></li><li class="custom-contextmenu-item copy-link">${i18n.global.t(
          'copy_link'
        )}</li>`
        document.body.appendChild(menuEle)
      }

      const uploadItem = menuEle?.querySelector('.upload-image')
      const copyItem = menuEle?.querySelector('.copy-link')

      if (type === ContextmenuEnum.img) {
        copyItem.style.display = 'block'
        uploadItem.innerHTML = i18n.global.t('management.contextmenu_1')
      } else {
        copyItem.style.display = 'none'
        uploadItem.innerHTML = i18n.global.t('management.contextmenu_2', {
          dir: selectedDir === '/' ? i18n.global.t('management.contextmenu_3') : selectedDir
        })
      }

      let setLeft = e.clientX
      let setTop = e.clientY
      const menuWidth = menuEle.clientWidth
      const menuHeight = menuEle.clientHeight
      const documentWidth = document.documentElement.clientWidth
      const documentHeight = document.documentElement.clientHeight
      const offset = 6

      if (menuWidth + setLeft > documentWidth) {
        setLeft = documentWidth - menuWidth - offset
      }

      if (menuHeight + setTop > documentHeight) {
        setTop = documentHeight - menuHeight - offset
      }

      menuEle.style.top = `${setTop}px`
      menuEle.style.left = `${setLeft}px`

      if (!isAddEventListenerOfContextmenu) {
        isAddEventListenerOfContextmenu = true

        uploadItem?.addEventListener('click', async () => {
          const dirMode = selectedDir === '/' ? DirModeEnum.rootDir : DirModeEnum.repoDir
          const selectedDirList = selectedDir === '/' ? [] : selectedDir.split('/')
          await store.dispatch('SET_USER_CONFIG_INFO', {
            dirMode,
            selectedDir,
            selectedDirList
          })
          await router.push('/upload')
        })

        copyItem?.addEventListener('click', async () => {
          const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
          const userSettings = computed(() => store.getters.getUserSettings).value
          copyImageLink(img, userConfigInfo, userSettings)
        })
      }

      const closeMenu = () => {
        if (menuEle) {
          document.removeEventListener('click', closeMenu)
          document.body.removeChild(menuEle)
          menuEle = null
          isAddEventListenerOfContextmenu = false
        }
      }
      document.addEventListener('click', closeMenu)
    })
  }
}

export default contextmenuDirective
