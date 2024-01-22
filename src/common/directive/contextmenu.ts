import { computed, Directive } from 'vue'
import router from '@/router'
import { store } from '@/stores'
import { ContextmenuEnum, DirModeEnum } from '@/common/model'
import { copyImageLink } from '@/utils'
import i18n from '@/plugins/vue/i18n'
import { renameFolder } from '@/common/directive/rename-dir'
import { removeDir } from '@/common/directive/remove-dir'

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
        menuEle.innerHTML = `<li class="custom-contextmenu-item upload-image"></li>
                             <li class="custom-contextmenu-item rename-dir">
                               ${i18n.global.t('upload.rename')}
                             </li>
                             <li class="custom-contextmenu-item remove-dir">
                               ${i18n.global.t('delete')}
                             </li>
                             <li class="custom-contextmenu-item copy-link">
                               ${i18n.global.t('copy_link')}
                             </li>`
        document.body.appendChild(menuEle)
      }

      const uploadItem = menuEle?.querySelector('.upload-image')
      const copyItem = menuEle?.querySelector('.copy-link')
      const renameItem = menuEle?.querySelector('.rename-dir')
      const removeItem = menuEle?.querySelector('.remove-dir')

      if (type === ContextmenuEnum.img) {
        copyItem.style.display = 'block'
        uploadItem.innerHTML = i18n.global.t('management.contextmenu_1')
      }

      if (type === ContextmenuEnum.parentDir) {
        copyItem.style.display = 'none'
        uploadItem.innerHTML = i18n.global.t('management.contextmenu_2', {
          dir: selectedDir === '/' ? i18n.global.t('management.contextmenu_3') : selectedDir
        })
      }

      if (type === ContextmenuEnum.childDir) {
        copyItem.style.display = 'none'
        renameItem.style.display = 'block'
        removeItem.style.display = 'block'
        uploadItem.innerHTML = i18n.global.t('management.contextmenu_2', {
          dir: selectedDir
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
          ElMessageBox.prompt('请输入新的名称', i18n.global.t('tips'), {
            confirmButtonText: i18n.global.t('confirm'),
            cancelButtonText: i18n.global.t('cancel')
          }).then(async ({ value }) => {
            if (!value) {
              return
            }

            const {
              owner,
              selectedRepo: repo,
              token,
              selectedBranch: branch
            } = computed(() => store.getters.getUserConfigInfo).value

            const res2 = await renameFolder(owner, repo, selectedDir, value, token, branch)
            console.log('res2 : ', res2)
          })
        })

        // 删除目录
        removeItem?.addEventListener('click', async () => {
          const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
          await removeDir(userConfigInfo, selectedDir)
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
