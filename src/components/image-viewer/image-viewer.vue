<template>
  <div
    class="image-viewer"
    :class="{ active: imageViewer.isShow }"
    @click="imageViewer.isShow = false"
  >
    <div class="image-info" v-if="imageViewer.imgInfo">
      <el-tag class="item" effect="plain" v-if="imageViewer.imgInfo.name">
        {{ imageViewer.imgInfo.name }}
      </el-tag>
      <el-tag class="item" effect="plain" v-if="imageViewer.imgInfo.size">
        {{ parseFileSize(imageViewer.imgInfo.size) }}
      </el-tag>
      <el-tag class="item" effect="plain" v-if="imageViewer.imgInfo.lastModified">
        {{ formatLastModified(imageViewer.imgInfo.lastModified) }}
      </el-tag>
    </div>
    <div class="image-box" v-if="imageViewer?.imgInfo?.url">
      <img class="img" :src="imageViewer?.imgInfo?.url" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/store'
import { getFileSize } from '@/common/utils/file-handle-helper'
import TimeHelper from '@/common/utils/time-helper'

const store = useStore()
const imageViewer = computed(() => store.getters.getImageViewer)

function parseFileSize(size: number) {
  return `${getFileSize(size)} KB`
}

function formatLastModified(t: number) {
  return TimeHelper.formatTimestamp(t)
}
</script>

<style scoped lang="stylus">
@import "image-viewer.styl"
</style>
