<template>
  <div class="upload-page-container">
    <!-- 左侧 / 上传图片列表 -->
    <div
      class="upload-page-left page-container"
      v-if="uploadImageList.length && globalSettings!.elementPlusSize !== ElementPlusSizeEnum.small"
    >
      <div class="uploaded-item" v-for="(item, index) in uploadImageList" :key="index + item.uuid">
        <upload-image-card :img-obj="item" @remove="remove($event)" />
      </div>
    </div>

    <!-- 右侧 / 上传操作 -->
    <div class="upload-page-right page-container" :class="{ 'has-left': uploadImageList.length }">
      <!-- 选择图片区域 -->
      <div class="row-item">
        <div class="content-box">
          <getting-images :disabled="uploading" ref="gettingImagesRef" @getImgList="setImgList" />
        </div>
      </div>

      <!-- 状态信息区域 -->
      <div class="row-item">
        <div class="content-box upload-area-status">
          <selected-info-bar />
          <span class="upload-count" v-if="uploadImageList.length">
            {{ $t('uploaded') }}：{{
              uploadImageList.filter((x) => x.uploadStatus.progress === 100).length
            }}
            /
            {{ uploadImageList.length }}
          </span>
        </div>
      </div>

      <!-- 部署 -->
      <div class="row-item" v-if="userConfigInfo.logined">
        <div class="content-box">
          <deploy-status-bar :disabled="!isCanDeploy" />
        </div>
      </div>

      <!-- 重置 & 上传   -->
      <div class="row-item" v-if="uploadImageList.length">
        <div class="content-box operation-btn">
          <el-button :disabled="uploading" plain type="warning" @click="resetUploadInfo">
            {{ $t('reset') }} <span class="shortcut-key">{{ shortcutKey }} A</span>
          </el-button>
          <el-button :disabled="uploading" plain type="primary" @click="uploadImage">
            {{ $t('upload') }} <span class="shortcut-key">{{ shortcutKey }} S</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, ref, Ref, onMounted, getCurrentInstance } from 'vue'
import { store } from '@/stores'
import router from '@/router'
import {
  ElementPlusSizeEnum,
  UploadedImageModel,
  UploadImageModel,
  UploadStatusEnum
} from '@/common/model'
import { batchCopyImageLinks, copyImageLink, getOSName } from '@/utils'
import { generateUploadImageObject } from './upload-image.util'
import { uploadImagesToGitHub, uploadImageToGitHub } from '@/utils/upload-utils'
import UploadImageCard from './components/upload-image-card/upload-image-card.vue'
import SelectedInfoBar from '@/views/upload-image/components/dir-info-bar/dir-info-bar.vue'

const instance = getCurrentInstance()

const gettingImagesRef: Ref = ref<null | HTMLElement>(null)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value
const logoutStatus = computed(() => store.getters.getUserLoginStatus)

const uploadImageList = ref<UploadImageModel[]>([])
const uploading = ref(false)
const shortcutKey = computed(() => (getOSName() === 'mac' ? '⌘' : 'Ctrl'))

const isCanDeploy = ref(false)

const setImgList = (imgList: any[]) => {
  imgList.forEach((v) => {
    store.dispatch('UPLOAD_IMG_LIST_ADD', generateUploadImageObject(v))
  })
}

// 重置选择图片的公共组件
const resetGettingImages = () => {
  gettingImagesRef.value?.reset()
}

// 上传图片的具体操作
// eslint-disable-next-line consistent-return
const doUploadImages = async (imgList: UploadImageModel[]) => {
  // 单张图片
  if (imgList.length === 1) {
    if (await uploadImageToGitHub(userConfigInfo, imgList[0])) {
      return UploadStatusEnum.uploaded
    }
    return UploadStatusEnum.uploadFail
  }

  // 多张图片
  if (imgList.length > 1) {
    if (await uploadImagesToGitHub(userConfigInfo, imgList)) {
      return UploadStatusEnum.allUploaded
    }
    return UploadStatusEnum.uploadFail
  }
}

// 上传成功之后的操作
const afterUploadSuccess = async (uploadedImg: UploadedImageModel[], isBatch: boolean = false) => {
  resetGettingImages()
  // 自动复制图片链接到系统剪贴板
  if (isBatch) {
    batchCopyImageLinks(uploadedImg, true)
  } else {
    copyImageLink(uploadedImg[0], true)
  }
  await store.dispatch('SET_USER_CONFIG_INFO', {
    viewDir: userConfigInfo.selectedDir
  })
}

// 上传
const uploadImage = async () => {
  const { token, repo, selectedDir } = userConfigInfo

  if (!token) {
    ElMessage.error({ message: instance?.proxy?.$t('upload_page.message1') })
    await router.push('/config')
    return
  }

  if (!repo) {
    ElMessage.error({ message: instance?.proxy?.$t('upload_page.message2') })
    await router.push('/config')
    return
  }

  if (!selectedDir) {
    ElMessage.error({ message: instance?.proxy?.$t('upload_page.message3') })
    await router.push('/config')
    return
  }

  const notYetUploadList = uploadImageList.value.filter((x) => x.uploadStatus.progress === 0)

  if (notYetUploadList.length === 0) {
    ElMessage.error({ message: instance?.proxy?.$t('upload_page.message4') })
    return
  }

  uploading.value = true
  const uploadRes: UploadStatusEnum = (await doUploadImages(notYetUploadList)) as UploadStatusEnum
  uploading.value = false
  const uploadedImg = notYetUploadList
    .filter((v) => v.uploadStatus.progress === 100)
    .map((x: UploadImageModel) => x.uploadedImg!)
  // eslint-disable-next-line default-case
  switch (uploadRes) {
    // 单张图片上传成功
    case UploadStatusEnum.uploaded:
      ElMessage.success({ message: instance?.proxy?.$t('upload_page.message5') })
      await afterUploadSuccess(uploadedImg)
      break

    // 多张图片上传成功
    case UploadStatusEnum.allUploaded:
      ElMessage.success({ message: instance?.proxy?.$t('upload_page.message6') })
      await afterUploadSuccess(uploadedImg, true)
      break

    // 上传失败（网络错误等原因）
    case UploadStatusEnum.uploadFail:
      ElMessage.error({ message: instance?.proxy?.$t('upload_page.message7') })
  }
}

// 重置
const resetUploadInfo = () => {
  uploading.value = false
  isCanDeploy.value = false
  store.dispatch('UPLOAD_IMG_LIST_RESET')
  resetGettingImages()
}

// 删除
const remove = (uuid: string) => {
  store.dispatch('UPLOAD_IMG_LIST_REMOVE', uuid)
  gettingImagesRef.value?.remove(uuid)
}

watch(
  () => logoutStatus,
  (_n) => {
    // 如果退出登录，清空信息
    // eslint-disable-next-line no-unused-expressions
    !_n && resetUploadInfo()
  }
)

watch(
  () => store.state.uploadImageListModule.uploadImageList,
  (nv) => {
    uploadImageList.value = nv
    isCanDeploy.value = uploadImageList.value.some((x) => x.uploadStatus.progress === 100)
  },
  {
    immediate: true,
    deep: true
  }
)

const registerShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    const keyCode = e.keyCode || e.which || e.charCode
    const ctrlKey = e.ctrlKey || e.metaKey

    // 重置操作快捷组合键 Command + A
    if (ctrlKey && keyCode === 65) {
      if (uploadImageList.value.length) {
        resetUploadInfo()
        e.preventDefault()
      }
    }

    // 上传操作快捷组合键 Command + S
    if (ctrlKey && keyCode === 83) {
      if (!uploading.value) {
        uploadImage()
        e.preventDefault()
      }
    }
  })
}

onMounted(() => {
  registerShortcuts()
})
</script>

<style lang="stylus">
@import "./upload-image.styl"
</style>
