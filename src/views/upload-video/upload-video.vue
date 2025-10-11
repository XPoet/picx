<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { UploadVideoModel, ElementPlusSizeEnum, VideoHandleResult } from '@/common/model'
import { store } from '@/stores'
import { getOSName } from '@/utils'
import { generateUploadVideoObject } from './utils/generate'
import GettingVideo from './components/getting-video/getting-video.vue'
import UploadVideoCard from './components/upload-video-card/upload-video-card.vue'
import VideoPreview from '@/components/video-preview/video-preview.vue'
import { useUploadVideo } from './hooks/use-upload-video'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const globalSettings = computed(() => store.getters.getGlobalSettings)
const logoutStatus = computed(() => store.getters.getUserLoginStatus)
const uploading = ref(false)
const isCanDeploy = ref(false)

const shortcutKey = computed(() => (getOSName() === 'mac' ? '⌘' : 'Ctrl'))

const uploadVideoList = ref<UploadVideoModel[]>([])

const gettingVideoRef = ref<InstanceType<typeof GettingVideo> | null>(null)
const resetGettingVideo = () => {
  gettingVideoRef.value?.setCurShowVideo({
    uuid: '',
    objectURL: ''
  })
}

const { uploadVideo } = useUploadVideo(uploadVideoList, () => {
  resetGettingVideo()
})

const handleGettingVideoList = (result: VideoHandleResult[]) => {
  result.forEach((v) => {
    store.dispatch('UPLOAD_VIDEO_LIST_ADD', generateUploadVideoObject(v))
  })
}

const remove = (uuid: string) => {
  const curShowVideo = gettingVideoRef.value?.getCurShowVideo()
  if (uuid === curShowVideo?.uuid) {
    resetGettingVideo()
  }
  store.dispatch('UPLOAD_VIDEO_LIST_REMOVE', uuid)
}

const videoPreviewRef = ref<InstanceType<typeof VideoPreview> | null>(null)
const handlePreview = (videoItem: UploadVideoModel) => {
  videoPreviewRef.value?.handleOpen({
    url: videoItem.objectURL,
    name: videoItem.filename.final
  })
}

const resetUploadInfo = () => {
  uploadVideoList.value = []
  isCanDeploy.value = false
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
  () => (store.state as any).uploadVideoListModule.uploadVideoList,
  (nv) => {
    uploadVideoList.value = nv
    isCanDeploy.value = uploadVideoList.value.some((x) => x.uploadStatus.progress === 100)

    const curShowVideo = gettingVideoRef.value?.getCurShowVideo()
    if (uploadVideoList.value.length > 0 && !curShowVideo?.uuid) {
      const latest = uploadVideoList.value[0]
      gettingVideoRef.value?.setCurShowVideo({
        uuid: latest.uuid,
        objectURL: latest.objectURL
      })
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div class="upload-page-container">
    <!-- 左侧 / 上传图片列表 -->
    <div
      class="upload-page-left page-container"
      v-if="uploadVideoList.length && globalSettings!.elementPlusSize !== ElementPlusSizeEnum.small"
    >
      <div class="uploaded-item" v-for="(item, index) in uploadVideoList" :key="index + item.uuid">
        <upload-video-card :video-item="item" @remove="remove($event)" @preview="handlePreview" />
      </div>
    </div>

    <!-- 右侧 / 上传操作 -->
    <div class="upload-page-right page-container" :class="{ 'has-left': uploadVideoList.length }">
      <!-- 选择图片区域 -->
      <div class="row-item">
        <div class="content-box">
          <getting-video
            ref="gettingVideoRef"
            :disabled="uploading"
            @get-video-list="handleGettingVideoList"
          />
        </div>
      </div>

      <!-- 状态信息区域 -->
      <div class="row-item">
        <div class="content-box upload-area-status">
          <selected-info-bar />
          <span class="upload-count" v-if="uploadVideoList.length">
            {{ $t('uploaded') }}：{{
              uploadVideoList.filter((x) => x.uploadStatus.progress === 100).length
            }}
            /
            {{ uploadVideoList.length }}
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
      <div class="row-item" v-if="uploadVideoList.length">
        <div class="content-box operation-btn">
          <el-button :disabled="uploading" plain type="warning" @click="resetUploadInfo">
            {{ $t('reset') }} <span class="shortcut-key">{{ shortcutKey }} A</span>
          </el-button>
          <el-button :disabled="uploading" plain type="primary" @click="uploadVideo">
            {{ $t('upload') }} <span class="shortcut-key">{{ shortcutKey }} S</span>
          </el-button>
        </div>
      </div>
    </div>
    <video-preview ref="videoPreviewRef" />
  </div>
</template>

<style lang="stylus">
@import "./upload-video.styl"
</style>
