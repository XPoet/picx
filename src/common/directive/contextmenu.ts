import { computed, Directive } from 'vue'
import router from '@/router'
import { store } from '@/store'
import { DirModeEnum } from '@/common/model'

const menuClass = 'custom-contextmenu-container'
let menuDom: any = null

const contextmenuDirective: Directive = {
  mounted(el: any, binding: any) {
    el.addEventListener('contextmenu', (e: any) => {
      e.preventDefault()
      e.stopPropagation()

      const viewDir = computed(() => store.getters.getUserViewDir).value

      const selectedDir = binding.value
        ? `${viewDir === '/' ? '' : `${viewDir}/`}${binding.value}`
        : viewDir

      menuDom = document.querySelector(`.${menuClass}`)

      if (!menuDom) {
        menuDom = document.createElement('ul')
        menuDom.setAttribute('class', menuClass)
        menuDom.style.position = 'fixed'
        menuDom.style.zIndex = '1000'
        menuDom.innerHTML = `<li class='custom-contextmenu-item upload-image'></li>`
        document.body.appendChild(menuDom)
      }

      menuDom.style.top = `${e.clientY}px`
      menuDom.style.left = `${e.clientX}px`

      const uploadBtnDom = menuDom?.querySelector('.upload-image')
      uploadBtnDom.innerHTML = `上传图片到 ${selectedDir} 目录`
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

      const closeMenu = () => {
        if (menuDom) {
          document.removeEventListener('click', closeMenu)
          document.body.removeChild(menuDom)
          menuDom = null
        }
      }
      document.addEventListener('click', closeMenu)
    })
  }
}

export default contextmenuDirective
