<template>
  <div class="img-process-state-card-container">
    <div class="img-container" v-loading="imgObj.processing" element-loading-text="正在压缩...">
      <el-image
        :src="imgObj.finialBase64 || imgObj.originalBase64"
        fit="cover"
        loading="lazy"
        data-fancybox="gallery"
      />
    </div>
    <div class="info-container">
      <div class="img-name text-ellipsis">{{ imgObj.finialName || imgObj.originalName }}</div>
      <div class="img-size">
        <div class="original-file-size file-size-item" :class="{ 'del-line': imgObj.finialSize }">
          {{ getFileSize(imgObj.originalSize) }} KB
        </div>
        <div v-if="imgObj.finialSize" class="finial-file-size file-size-item">
          {{ getFileSize(imgObj.finialSize) }} KB
        </div>
      </div>
    </div>
    <div
      class="operate-container flex-center"
      v-if="imgObj.finialFile"
      @click="download(imgObj.finialFile)"
    >
      点击下载
    </div>
    <div
      class="operate-container flex-center"
      v-if="cardType === 'base64' && imgObj.originalBase64"
      @click="copyBase64(imgObj.originalBase64)"
    >
      点击复制 Base64 编码
    </div>
    <el-tooltip placement="top" :offset="8" content="删除">
      <el-icon class="del-btn" @click="remove(imgObj.uuid)"><Remove /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ImgProcessStateModel } from '@/common/model'
import { copyText, downloadImage, getFileSize } from '@/utils'

const emit = defineEmits(['remove'])

defineProps({
  imgObj: {
    type: Object as () => ImgProcessStateModel,
    require: true,
    default: () => ({})
  },
  cardType: {
    type: String,
    default: 'compress' // compress | base64
  }
})

const remove = (uuid: string) => {
  emit('remove', uuid)
}

// 下载图片到本地
const download = (file: File) => {
  downloadImage(file)
}

// 复制 Base64 编码
const copyBase64 = (base64: string) => {
  copyText(base64, () => {
    ElMessage.success({ message: ' Base64 编码复制成功' })
  })
}
</script>

<style scoped lang="stylus">
@import "./img-process-state-card.styl"
</style>
