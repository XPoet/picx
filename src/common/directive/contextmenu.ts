import { Directive } from 'vue'
import router from '@/router'
import { store } from '@/store'
import { DirModeEnum } from '@/common/model'

const menuClass = 'custom-contextmenu-container'
let menuDom: any = null

const contextmenuDirective: Directive = {
  mounted(el: any, binding: any) {
    // 绑定 contextmenu 事件
    el.addEventListener('contextmenu', (e: any) => {
      e.preventDefault()

      menuDom = document.querySelector(`.${menuClass}`)

      if (!menuDom) {
        menuDom = document.createElement('ul')
        menuDom.setAttribute('class', menuClass)
        menuDom.innerHTML = `<li class="contextmenu-item upload-image">上传图片</li>`
        menuDom.style.position = 'fixed'
        menuDom.style.zIndex = '1000'
        document.body.appendChild(menuDom)
      }

      menuDom.style.top = `${e.clientY}px`
      menuDom.style.left = `${e.clientX}px`

      const uploadBtnDom = menuDom?.querySelector('.upload-image')
      uploadBtnDom?.addEventListener('click', async () => {
        await store.dispatch('SET_USER_CONFIG_INFO', {
          dirMode: DirModeEnum.repoDir,
          selectedDir: binding.value.dir,
          selectedDirList: binding.value.dir.split('/')
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
