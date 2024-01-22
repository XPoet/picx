import { computed, Directive } from 'vue'
import router from '@/router'
import { store } from '@/stores'
import { ContextmenuEnum } from './types'
import { DirModeEnum } from '@/common/model'
import { copyImageLink } from '@/utils'
import i18n from '@/plugins/vue/i18n'

const menuClass = 'custom-contextmenu-container'
let menuEle: any = null
let isAddEventListenerOfContextmenu: boolean = false

// 右键菜单指令
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
        menuEle.innerHTML = `<li class="custom-contextmenu-item upload-image">
                             </li>
                             <li class="custom-contextmenu-item paste-image">
                               ${i18n.global.t('paste_image')}
                             </li>
                             <li class="custom-contextmenu-item rename-dir">
                               ${i18n.global.t('rename')}
                             </li>
                             <li class="custom-contextmenu-item remove-dir">
                               ${i18n.global.t('delete')}
                             </li>
                             <li class="custom-contextmenu-item copy-link">
                               ${i18n.global.t('copy_link')}
                             </li>`
        document.body.appendChild(menuEle)
      }

      const copyItem = menuEle?.querySelector('.copy-link')
      const uploadItem = menuEle?.querySelector('.upload-image')
      const renameItem = menuEle?.querySelector('.rename-dir')
      const removeItem = menuEle?.querySelector('.remove-dir')
      const pasteItem = menuEle?.querySelector('.paste-image')

      // 图片
      if (type === ContextmenuEnum.img) {
        copyItem.style.display = 'flex'
        uploadItem.style.display = 'flex'
        uploadItem.innerHTML = i18n.global.t('management_page.contextmenu_1')
      }

      // 目录
      if (type === ContextmenuEnum.dir) {
        // renameItem.style.display = 'flex'
        // removeItem.style.display = 'flex'
        uploadItem.style.display = 'flex'
        uploadItem.innerHTML = i18n.global.t('management_page.contextmenu_2', {
          dir: selectedDir
        })
      }

      // 目录区域
      if (type === ContextmenuEnum.dirArea) {
        uploadItem.style.display = 'flex'
        uploadItem.innerHTML = i18n.global.t('management_page.contextmenu_2', {
          dir: selectedDir === '/' ? i18n.global.t('management_page.contextmenu_3') : selectedDir
        })
      }

      // 上传区域
      if (type === ContextmenuEnum.uploadArea) {
        pasteItem.style.display = 'flex'
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

        // 上传图片
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

        // 复制图片链接
        copyItem?.addEventListener('click', async () => {
          const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
          const userSettings = computed(() => store.getters.getUserSettings).value
          copyImageLink(img, userConfigInfo, userSettings)
        })

        // 重命名目录
        renameItem?.addEventListener('click', async () => {
          ElMessageBox.prompt(i18n.global.t('config_page.message_7'), i18n.global.t('tip'), {
            confirmButtonText: i18n.global.t('confirm'),
            cancelButtonText: i18n.global.t('cancel')
          }).then(async ({ value }) => {
            if (!value) {
              return
            }

            // TODO
            console.log('new dir: ', value)
          })
        })

        // 删除目录
        removeItem?.addEventListener('click', async () => {
          // TODO
          console.log('删除目录')
        })

        // 上传区域粘贴图片
        pasteItem?.addEventListener('click', () => {
          store.commit('SET_UPLOAD_AREA_STATE', {
            isPaste: true
          })
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
