import { computed, Directive } from 'vue'
import router from '@/router'
import { store } from '@/store'
import { ContextmenuEnum, DirModeEnum } from '@/common/model'
import { copyImageLink } from '@/utils'

const menuClass = 'custom-contextmenu-container'
let menuDom: any = null
let isAddEventListenerByBtns: boolean = false

const contextmenuDirective: Directive = {
  mounted(el: any, binding: any) {
    el.addEventListener('contextmenu', (e: any) => {
      const { dir, type, img } = binding.value

      e.preventDefault()
      e.stopPropagation()

      const viewDir = computed(() => store.getters.getUserViewDir).value

      const selectedDir = dir ? `${viewDir === '/' ? '' : `${viewDir}/`}${dir}` : viewDir

      menuDom = document.querySelector(`.${menuClass}`)

      if (!menuDom) {
        menuDom = document.createElement('ul')
        menuDom.setAttribute('class', menuClass)
        menuDom.style.position = 'fixed'
        menuDom.style.zIndex = '1000'
        menuDom.innerHTML = `<li class="custom-contextmenu-item upload-image"></li><li class="custom-contextmenu-item copy-link">复制图片链接</li>`
        document.body.appendChild(menuDom)
      }

      const uploadBtnDom = menuDom?.querySelector('.upload-image')
      const copyBtnDom = menuDom?.querySelector('.copy-link')

      menuDom.style.top = `${e.clientY}px`
      menuDom.style.left = `${e.clientX}px`

      if (type === ContextmenuEnum.img) {
        copyBtnDom.style.display = 'block'
        uploadBtnDom.innerHTML = `从当前位置上传新图片`
      } else {
        copyBtnDom.style.display = 'none'
        uploadBtnDom.innerHTML = `上传图片到 < ${
          selectedDir === '/' ? '根目录' : selectedDir
        } > 目录`
      }

      if (!isAddEventListenerByBtns) {
        isAddEventListenerByBtns = true

        uploadBtnDom?.addEventListener('click', async () => {
          const dirMode = selectedDir === '/' ? DirModeEnum.rootDir : DirModeEnum.repoDir
          const selectedDirList = selectedDir === '/' ? [] : selectedDir.split('/')
          await store.dispatch('SET_USER_CONFIG_INFO', {
            dirMode,
            selectedDir,
            selectedDirList
          })
          await router.push('/upload')
        })

        copyBtnDom?.addEventListener('click', async () => {
          const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
          const userSettings = computed(() => store.getters.getUserSettings).value
          copyImageLink(img, userConfigInfo, userSettings)
        })
      }

      const closeMenu = () => {
        if (menuDom) {
          document.removeEventListener('click', closeMenu)
          document.body.removeChild(menuDom)
          menuDom = null
          isAddEventListenerByBtns = false
        }
      }
      document.addEventListener('click', closeMenu)
    })
  }
}

export default contextmenuDirective
