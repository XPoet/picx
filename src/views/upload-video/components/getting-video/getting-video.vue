<!-- eslint-disable no-unused-vars -->
<script lang="ts" setup>
import { unref } from 'vue'
import { VideoHandleResult } from '@/common/model'
import { useGettingVideo } from './hooks/use-getting-vidoe'

const emit = defineEmits<{
  (e: 'getVideoList', value: VideoHandleResult[]): void
}>()

defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const { onDrop, onPaste, onSelect, curShowVideo } = useGettingVideo((result) => {
  // 传递给父组件
  emit('getVideoList', result)
})

const setCurShowVideo = (item: { uuid: string; objectURL: string }) => {
  curShowVideo.value = item
}

const getCurShowVideo = () => {
  return unref(curShowVideo)
}

defineExpose({
  setCurShowVideo,
  getCurShowVideo
})
</script>

<template>
  <div
    class="getting-images-container"
    :class="{ focus: !!curShowVideo.objectURL && curShowVideo.objectURL, disabled: disabled }"
    @dragover.prevent
    @drop.stop.prevent="onDrop"
    @paste.stop="onPaste"
  >
    <label for="input-file-selector"></label>
    <input id="input-file-selector" type="file" accept="video/*" @change="onSelect" multiple />
    <div class="upload-area-tips" v-if="!curShowVideo.objectURL">
      <el-icon class="icon"><IEpUploadFilled /></el-icon>
      <div class="text">{{ $t('upload_page.upload_video_area_text') }}</div>
    </div>
    <video class="preview-video" v-if="curShowVideo.objectURL" :src="curShowVideo.objectURL" />
  </div>
</template>

<style lang="stylus">
@import "./getting-video.styl"
</style>
