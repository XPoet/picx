import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'
import { getDirContent, getUpOneLevelDir } from '@/stores/modules/dir-image-list/utils'
import { deleteDirOnGitHub, renameDirOnGitHub } from '@/utils/repo-content-utils'

/**
 * 校验目录名称：非空，且不含空格、反斜杠、斜杠（不允许 . 和 ..）
 * @param name
 */
export const isValidDirName = (name: string): boolean => {
  return /^[^\s\\/]+$/.test(name) && name !== '.' && name !== '..'
}

/**
 * 重命名目录
 * @param dirPath 目录完整路径
 */
export const onRenameDir = (dirPath: string) => {
  const currentDirName = dirPath.slice(dirPath.lastIndexOf('/') + 1)

  ElMessageBox.prompt(i18n.global.t('management_page.renameDirTips'), i18n.global.t('tip'), {
    draggable: true,
    inputPattern: /^[^\s\\/]+$/,
    inputErrorMessage: i18n.global.t('management_page.dirNameInvalid'),
    autofocus: true,
    inputValue: currentDirName,
    beforeClose: async (action, instance, done) => {
      if (action !== 'confirm') {
        done()
        return
      }

      const newDirName = (instance.inputValue || '').trim()

      if (!isValidDirName(newDirName)) {
        ElMessage.warning(i18n.global.t('management_page.dirNameInvalid'))
        return
      }

      if (newDirName === currentDirName) {
        ElMessage.warning(i18n.global.t('management_page.dirNameUnchanged'))
        return
      }

      const parentPath = getUpOneLevelDir(dirPath).dirPath
      const parentDirectory = getDirContent(parentPath, store.getters.getDirObject)
      if (parentDirectory?.childrenDirs.some(item => item.dir === newDirName)) {
        ElMessage.warning(i18n.global.t('management_page.dirNameDuplicated'))
        return
      }

      instance.confirmButtonLoading = true
      instance.confirmButtonText = i18n.global.t('management_page.loadingTxt2')

      const userConfigInfo = store.getters.getUserConfigInfo
      const res = await renameDirOnGitHub(userConfigInfo, dirPath, newDirName)

      instance.confirmButtonLoading = false

      if (res) {
        ElMessage.success(i18n.global.t('management_page.message4'))
        done()
      }
      else {
        ElMessage.error(i18n.global.t('management_page.dirRenameFail'))
      }
    },
  })
}

/**
 * 删除目录（含目录下所有文件）
 * @param dirPath 目录完整路径
 */
export const onDeleteDir = (dirPath: string) => {
  ElMessageBox.confirm(
    i18n.global.t('management_page.delDirTips'),
    i18n.global.t('tip'),
    {
      type: 'warning',
      draggable: true,
    },
  )
    .then(async () => {
      const loading = ElLoading.service({
        text: i18n.global.t('management_page.loadingTxt3'),
      })

      const userConfigInfo = store.getters.getUserConfigInfo
      const res = await deleteDirOnGitHub(userConfigInfo, dirPath)

      loading.close()

      if (res) {
        ElMessage.success(i18n.global.t('management_page.message5'))
      }
      else {
        ElMessage.error(i18n.global.t('management_page.message7'))
      }
    })
    .catch(() => undefined)
}
