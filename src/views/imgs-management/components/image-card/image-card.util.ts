import { computed } from 'vue'
import i18n from '@/plugins/vue/i18n'
import { UploadedImageModel, UploadImageModel } from '@/common/model'
import { deleteSingleImage } from '@/common/api'
import { store } from '@/stores'
import {
  blobToBase64ByImageUrl,
  createUploadImageObject,
  generateImageLink,
  getBase64ByImageUrl,
  getFilename,
  getFileSize,
  getFileSuffix,
  getUuid
} from '@/utils'
import { uploadImageToGitHub } from '@/utils/upload-utils'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const { owner, repo } = userConfigInfo

export const doDeleteImage = async (imgObj: UploadedImageModel) => {
  imgObj.deleting = true
  const { path, sha } = imgObj
  const res = await deleteSingleImage(owner, repo, path, sha)
  if (res) {
    ElMessage.success({ message: i18n.global.t('management_page.message5') })
    await store.dispatch('DIR_IMAGE_LIST_REMOVE', imgObj)
    await store.dispatch('UPLOAD_IMG_LIST_REMOVE', imgObj.uuid)
  } else {
    ElMessage.error({ message: i18n.global.t('management_page.message7') })
  }
}

export const onDeleteImage = (imgObj: UploadedImageModel) => {
  ElMessageBox.confirm(
    `
    <div>${i18n.global.t('management_page.delTips')}：</div>
    <strong>${imgObj.name}</strong>
    `,
    i18n.global.t('tip'),
    {
      dangerouslyUseHTMLString: true,
      type: 'warning'
    }
  )
    .then(async () => {
      await doDeleteImage(imgObj)
    })
    .catch(() => {
      console.log('Cancel')
    })
}

// 重命名的逻辑是先上传一张新名称的图片，再删除旧图片
export const doRenameImage = async (imgObj: UploadedImageModel, newName: string) => {
  const suffix = getFileSuffix(imgObj.name)
  const newUuid = getUuid()
  const imgName = `${newName}.${suffix}`

  let base64

  if (!suffix.includes('svg')) {
    base64 = await getBase64ByImageUrl(generateImageLink(imgObj) || '', suffix)
  } else {
    base64 = await blobToBase64ByImageUrl(generateImageLink(imgObj) || '')
  }

  if (base64) {
    const tmpImgObj: UploadImageModel = createUploadImageObject()
    tmpImgObj.uuid = newUuid
    tmpImgObj.base64.originalBase64 = base64
    tmpImgObj.filename.final = imgName
    tmpImgObj.reUploadInfo!.isReUpload = true
    tmpImgObj.reUploadInfo!.dir = imgObj.dir
    let path = imgName
    if (imgObj.dir !== '/') {
      path = `${imgObj.dir}/${imgName}`
    }
    tmpImgObj.reUploadInfo!.path = path

    // 上传重命名后的图片
    const isUploadSuccess = await uploadImageToGitHub(userConfigInfo, tmpImgObj)

    if (isUploadSuccess) {
      const { path, sha } = imgObj
      // 删除旧图片
      await deleteSingleImage(owner, repo, path, sha)
      await store.dispatch('UPLOAD_IMG_LIST_REMOVE', imgObj.uuid)
      await store.dispatch('DIR_IMAGE_LIST_REMOVE', imgObj)
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  }
  return Promise.resolve(false)
}

export const onRenameImage = async (imgObj: UploadedImageModel) => {
  const newName = getFilename(imgObj.name)
  await ElMessageBox.prompt(i18n.global.t('management_page.text_1'), i18n.global.t('tip'), {
    draggable: true,
    inputPattern: /^.+$/,
    inputErrorMessage: i18n.global.t('management_page.message1'),
    autofocus: true,
    inputValue: newName,
    beforeClose: async (action, instance, done) => {
      if (action === 'confirm') {
        if (instance.inputValue === newName) {
          ElMessage.warning(i18n.global.t('management_page.message2'))
          return
        }
        instance.confirmButtonLoading = true
        instance.confirmButtonText = i18n.global.t('management_page.loadingTxt2')
        const res = await doRenameImage(imgObj, instance.inputValue)
        if (res) {
          instance.confirmButtonLoading = false
          ElMessage.success(i18n.global.t('management_page.message4'))
          done()
        } else {
          ElMessage.error(i18n.global.t('management_page.message3'))
        }
      } else {
        done()
      }
    }
  })
}

export const checkImgProperty = async (imgObj: UploadedImageModel) => {
  await ElMessageBox.confirm(
    `
    <div>${i18n.global.t('management_page.imageName')}：<strong>${imgObj.name}</strong></div>
    <div>${i18n.global.t('management_page.imageSize')}：<strong>${getFileSize(
      imgObj.size
    )} KB</strong></div>
    `,
    i18n.global.t('management_page.property'),
    {
      showCancelButton: false,
      showConfirmButton: false,
      dangerouslyUseHTMLString: true,
      type: 'info'
    }
  )
}
