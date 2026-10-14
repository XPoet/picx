<script setup lang="ts">
import type { ImgProcessStateModel } from '@/common/model'
import { copyText, downloadImage, getFileSize } from '@/utils'

defineProps({
  imgObj: {
    type: Object as () => ImgProcessStateModel,
    require: true,
    default: () => ({}),
  },
  cardType: {
    type: String,
    default: 'compress', // compress | base64 | watermark
  },
})

const emit = defineEmits(['remove'])

const remove = (uuid: string) => {
  emit('remove', uuid)
}

// 下载图片到本地
const download = (file: File) => {
  downloadImage(file)
}

// 复制 Base64 编码
const copyBase64 = (base64: string, $t: any) => {
  copyText(base64, () => {
    ElMessage.success({ message: $t('toolbox.copy_base64_success') })
  })
}
</script>

<template>
  <div class="img-process-state-card-container">
    <div v-loading="Boolean(imgObj.processing)" class="img-container">
      <el-image
        :src="imgObj.finialBase64 || imgObj.originalBase64"
        fit="cover"
        loading="lazy"
        :hide-on-click-modal="true"
        :preview-src-list="[imgObj.finialBase64 || imgObj.originalBase64]"
      />
    </div>
    <div class="info-container">
      <div class="img-name text-ellipsis">
        {{ imgObj.finialName || imgObj.originalName }}
      </div>
      <div class="img-size">
        <div
          class="original-file-size file-size-item"
          :class="{ 'del-line': imgObj.finialSize && cardType === 'compress' }"
        >
          {{ getFileSize(imgObj.originalSize) }} KB
        </div>
        <div
          v-if="imgObj.finialSize && cardType === 'compress'"
          class="finial-file-size file-size-item"
        >
          {{ getFileSize(imgObj.finialSize) }} KB
        </div>
      </div>
    </div>
    <div
      v-if="imgObj.finialFile"
      class="operate-container flex-center"
      @click="download(imgObj.finialFile)"
    >
      {{ $t('toolbox.click_download') }}
    </div>
    <div
      v-if="cardType === 'base64' && imgObj.originalBase64"
      class="operate-container flex-center"
      @click="copyBase64(imgObj.originalBase64, $t)"
    >
      {{ $t('toolbox.copy_base64') }}
    </div>
    <el-tooltip placement="top" :offset="8" :content="$t('delete')">
      <el-icon class="del-btn" @click="remove(imgObj.uuid)">
        <IEpRemove />
      </el-icon>
    </el-tooltip>
  </div>
</template>

<style scoped lang="stylus">
@import "./img-process-state-card.styl"
</style>
