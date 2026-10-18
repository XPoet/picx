import type { UploadedImageModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ManagementBatchResult } from '@/common/model/management'
import { ref, shallowRef } from 'vue'
import { DirModeEnum } from '@/common/model'
import i18n from '@/plugins/vue/i18n'
import router from '@/router'
import { pinia, store } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { copyImageLink, getGitHubRepoDirURL } from '@/utils'
import { isValidManagementName } from '@/utils/management-utils'
import { changeManagementDirectory, deleteManagementMedia, relocateManagementMedia } from './management'

export const managementBusy = ref(false)
export const managementDeleteResult = shallowRef<ManagementBatchResult | null>(null)
const t = i18n.global.t
const target = (): RepositoryIdentity => {
  const { owner, repo, branch } = store.getters.getUserConfigInfo
  return { owner, repo, branch }
}
const sameRepository = (repository: RepositoryIdentity) => {
  const config = store.getters.getUserConfigInfo
  return config.logined && config.owner === repository.owner && config.repo === repository.repo && config.branch === repository.branch
}

export async function deleteMediaWithConfirmation(images: readonly UploadedImageModel[]): Promise<ManagementBatchResult | null> {
  if (managementBusy.value || !images.length)
    return null
  managementBusy.value = true
  const repository = target()
  const snapshot = images.map(image => ({ ...image }))
  try {
    await ElMessageBox.confirm(t('management_page.workspace.deleteSelectionConfirm', { total: snapshot.length, dir: snapshot[0].dir }), t('management_page.workspace.batchDelete'), { type: 'warning', confirmButtonText: t('confirm'), cancelButtonText: t('cancel') })
    if (!sameRepository(repository))
      return null
    const result = await deleteManagementMedia(repository, snapshot)
    if (!sameRepository(repository))
      return result
    managementDeleteResult.value = result
    if (result.failures.length)
      ElMessage.error(t('management_page.workspace.deletePartial', { succeeded: result.successes.length, failed: result.failures.length }))
    else ElMessage.success(t('management_page.message6'))
    if (result.cacheFailed)
      ElMessage.warning(t('management_page.workspace.cacheFailed'))
    return result
  }
  catch {
    return null
  }
  finally {
    managementBusy.value = false
  }
}

export function showMediaProperties(image: UploadedImageModel) {
  const lines = [image.name, image.path, ...(image.size > 0 ? [`${Number((image.size / 1024).toFixed(2))} KB`] : [])]
  return ElMessageBox.confirm(lines.join('\n'), t('management_page.property'), { confirmButtonText: t('confirm'), showCancelButton: false }).catch(() => undefined)
}

export function openMediaMove(image: UploadedImageModel) {
  store.commit('SET_UPLOAD_AREA_STATE', { isShowMoveImageDialog: true, moveImageInfo: image })
}

export async function renameMedia(image: UploadedImageModel) {
  if (managementBusy.value)
    return
  managementBusy.value = true
  const repository = target()
  try {
    const result = await ElMessageBox.prompt(t('management_page.workspace.renameImpact', { path: image.path }), t('rename'), { inputValue: image.name, inputValidator: (value: string) => isValidManagementName(value) || t('management_page.dirNameInvalid'), confirmButtonText: t('confirm'), cancelButtonText: t('cancel') })
    if (!sameRepository(repository))
      return
    managementBusy.value = true
    const response = await relocateManagementMedia(repository, image, image.dir, result.value)
    if (!sameRepository(repository))
      return
    if (!response.ok) {
      ElMessage.error(t(`request_error.${response.error.kind}`))
    }
    else {
      ElMessage.success(t('management_page.message4'))
      if (response.data.cacheFailed)
        ElMessage.warning(t('management_page.workspace.cacheFailed'))
    }
  }
  catch {}
  finally {
    managementBusy.value = false
  }
}

export { isValidManagementName }

export async function editDirectory(path: string, action: 'rename' | 'delete') {
  if (managementBusy.value || path === '/')
    return
  managementBusy.value = true
  const repository = target()
  try {
    let name: string | undefined
    if (action === 'rename') {
      const result = await ElMessageBox.prompt(t('management_page.workspace.renameDirectoryImpact', { path }), t('rename'), { inputValue: path.split('/').at(-1), inputValidator: (value: string) => isValidManagementName(value) || t('management_page.dirNameInvalid'), confirmButtonText: t('confirm'), cancelButtonText: t('cancel') })
      name = result.value
    }
    else {
      await ElMessageBox.confirm(t('management_page.workspace.deleteDirectoryImpact', { path }), t('management_page.workspace.deleteDirectory'), { type: 'warning', confirmButtonText: t('confirm'), cancelButtonText: t('cancel') })
    }
    if (!sameRepository(repository))
      return
    managementBusy.value = true
    const response = await changeManagementDirectory(repository, path, name)
    if (!sameRepository(repository))
      return
    if (!response.ok) {
      ElMessage.error(t(`request_error.${response.error.kind}`))
    }
    else {
      ElMessage.success(t(action === 'rename' ? 'management_page.message4' : 'management_page.message5'))
      if (response.data.cacheFailed)
        ElMessage.warning(t('management_page.workspace.cacheFailed'))
    }
  }
  catch {}
  finally {
    managementBusy.value = false
  }
}

export function openManagementRepository(path: string) {
  window.open(getGitHubRepoDirURL(store.getters.getUserConfigInfo, path === '/' ? '' : path), '_blank', 'noopener,noreferrer')
}

export async function uploadToManagementDirectory(path: string) {
  const result = usePicxStore(pinia).SAVE_UPLOAD_DIRECTORY({ dirMode: path === '/' ? DirModeEnum.rootDir : DirModeEnum.repoDir, selectedDir: path, selectedDirList: path === '/' ? [] : path.split('/') })
  if (!result.ok) {
    ElMessage.error(t(`management_page.workspace.${result.reason === 'upload-busy' ? 'uploadBusy' : 'uploadSaveFailed'}`))
    return
  }
  await router.push('/upload')
}

export { copyImageLink }
