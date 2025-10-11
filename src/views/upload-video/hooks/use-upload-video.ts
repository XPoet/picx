import { computed, ref, Ref } from 'vue'
import { UploadedVideoModel, UploadStatusEnum, UploadVideoModel } from '@/common/model'
import { store } from '@/stores'
import { beforeUpload, uploadVideosToGitHub, uploadVideoToGitHub } from '@/utils/upload-utils'
import i18n from '@/plugins/vue/i18n'
import { batchCopyVideoLinks, copyVideoLink } from '@/utils/video-utils'

export const useUploadVideo = (
  uploadVideoList: Ref<UploadVideoModel[]>,
  onUploadSuccess: () => void
) => {
  const uploading = ref(false)

  const userConfigInfo = computed(() => store.getters.getUserConfigInfo)

  const doUploadVideos = async (videoList: UploadVideoModel[]) => {
    // 单个视频
    if (videoList.length === 1) {
      if (await uploadVideoToGitHub(userConfigInfo.value, videoList[0])) {
        return UploadStatusEnum.uploaded
      }
      return UploadStatusEnum.uploadFail
    }

    // 多个视频
    if (videoList.length > 1) {
      if (await uploadVideosToGitHub(userConfigInfo.value, videoList)) {
        return UploadStatusEnum.allUploaded
      }
      return UploadStatusEnum.uploadFail
    }

    return UploadStatusEnum.uploadFail
  }

  // 上传成功之后的操作
  const afterUploadSuccess = async (
    uploadedVideo: UploadedVideoModel[],
    isBatch: boolean = false
  ) => {
    // 自动复制链接到系统剪贴板
    if (isBatch) {
      batchCopyVideoLinks(uploadedVideo, true)
    } else {
      copyVideoLink(uploadedVideo[0], true)
    }
    await store.dispatch('SET_USER_CONFIG_INFO', {
      viewDir: userConfigInfo.value.selectedDir
    })
    onUploadSuccess()
  }

  const uploadVideo = async () => {
    const notYetUploadList = await beforeUpload(userConfigInfo.value, uploadVideoList.value)
    if (notYetUploadList.length === 0) {
      return
    }

    uploading.value = true

    const result = await doUploadVideos(notYetUploadList)

    uploading.value = false

    const uploadedVideo = notYetUploadList
      .filter((v) => v.uploadStatus.progress === 100)
      .map((x) => x.uploadedVideo!)

    switch (result) {
      // 单视频上传成功
      case UploadStatusEnum.uploaded:
        ElMessage.success({ message: i18n.global.t('upload_page.message5') })
        await afterUploadSuccess(uploadedVideo)
        break

      // 多视频上传成功
      case UploadStatusEnum.allUploaded:
        ElMessage.success({ message: i18n.global.t('upload_page.message6') })
        await afterUploadSuccess(uploadedVideo, true)
        break

      // 上传失败（网络错误等原因）
      case UploadStatusEnum.uploadFail:
        ElMessage.error({ message: i18n.global.t('upload_page.message7') })
        break
      default:
        break
    }
    console.log('开始上传视频')
  }

  return {
    uploadVideo
  }
}
