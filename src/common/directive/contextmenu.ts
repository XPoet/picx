import { computed, Directive } from 'vue'
import router from '@/router'
import { store } from '@/stores'
import { ContextmenuEnum } from './types'
import { DirModeEnum } from '@/common/model'
import { copyImageLink } from '@/utils'
import i18n from '@/plugins/vue/i18n'
import {
  checkImgProperty,
  onDeleteImage,
  onRenameImage
} from '@/views/imgs-management/components/image-card/image-card.util'

const menuClass = 'custom-contextmenu-container'
let menuEle: any = null
let isAddEventListenerOfContextmenu: boolean = false

// 右键菜单指令
const contextmenuDirective: Directive = {
  mounted(el: any, binding: any) {
    el.addEventListener('contextmenu', (e: any) => {
      e.preventDefault()
      e.stopPropagation()

      const { type, dir, img } = binding.value

      store.commit('SET_UPLOAD_AREA_STATE', { activeInfo: { dir, type, img } })

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
                             <li class="custom-contextmenu-item copy-link">
                               ${i18n.global.t('copy_link')}
                             </li>
                             <li class="custom-contextmenu-item property">
                               ${i18n.global.t('management_page.property')}
                             </li>
                             <li class="custom-contextmenu-item rename">
                               ${i18n.global.t('rename')}
                             </li>
                             <li class="custom-contextmenu-item remove">
                               ${i18n.global.t('delete')}
                             </li>
                             `
        document.body.appendChild(menuEle)
      }

      const uploadItem = menuEle?.querySelector('.upload-image')
      const removeItem = menuEle?.querySelector('.remove')
      const renameItem = menuEle?.querySelector('.rename')
      const copyLinkItem = menuEle?.querySelector('.copy-link')
      const propertyItem = menuEle?.querySelector('.property')
      const pasteImageItem = menuEle?.querySelector('.paste-image')

      const hideAllContextmenu = () => {
        menuEle.querySelectorAll('.custom-contextmenu-item').forEach((d: HTMLElement) => {
          d.style.display = 'none'
        })
      }

      const showContextmenu = (domList: HTMLElement[]) => {
        domList.forEach((d: HTMLElement) => {
          d.style.display = 'flex'
        })
      }

      // 图片
      if (type === ContextmenuEnum.img) {
        hideAllContextmenu()
        showContextmenu([copyLinkItem, removeItem, renameItem, propertyItem])
      }

      // 目录
      if (type === ContextmenuEnum.dir) {
        hideAllContextmenu()
        showContextmenu([uploadItem])
        uploadItem.innerHTML = i18n.global.t('management_page.contextmenu_2', {
          dir: selectedDir
        })
      }

      // 目录区域
      if (type === ContextmenuEnum.dirArea) {
        hideAllContextmenu()
        showContextmenu([uploadItem])
        uploadItem.innerHTML = i18n.global.t('management_page.contextmenu_1')
      }

      // 上传区域
      if (type === ContextmenuEnum.uploadArea) {
        hideAllContextmenu()
        showContextmenu([pasteImageItem])
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

        // 重命名
        renameItem?.addEventListener('click', async () => {
          if (type === ContextmenuEnum.img) {
            await onRenameImage(img)
          }

          if (type === ContextmenuEnum.dir) {
            // TODO 重命名目录
          }
        })

        // 删除
        removeItem?.addEventListener('click', async () => {
          if (type === ContextmenuEnum.img) {
            onDeleteImage(img)
          }

          if (type === ContextmenuEnum.dir) {
            // TODO 删除目录
          }
        })

        // 复制图片链接
        copyLinkItem?.addEventListener('click', async () => {
          copyImageLink(img)
        })

        // 查看图片属性
        propertyItem?.addEventListener('click', async () => {
          await checkImgProperty(img)
        })

        // 上传区域粘贴图片
        pasteImageItem?.addEventListener('click', () => {
          store.commit('SET_UPLOAD_AREA_STATE', {
            isPaste: true
          })
        })
      }

      const closeContextMenu = () => {
        store.commit('SET_UPLOAD_AREA_STATE', { activeInfo: null })
        if (menuEle) {
          document.removeEventListener('click', closeContextMenu)
          document.body.removeChild(menuEle)
          menuEle = null
          isAddEventListenerOfContextmenu = false
        }
      }
      document.addEventListener('click', closeContextMenu)
      document.addEventListener('dblclick', closeContextMenu)
    })
  }
}

export default contextmenuDirective
