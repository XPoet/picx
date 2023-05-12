<template>
  <div class="copy-image-link-box">
    <div class="left">
      <el-tooltip :content="leftSideTip" placement="top">
        <el-icon><IEpInfoFilled /></el-icon>
      </el-tooltip>
    </div>
    <div class="right">
      <el-button plain type="primary" size="small" @click="oneClickCopy">
        <el-icon><IEpCopyDocument /></el-icon>&nbsp;{{ $t('upload.copyLink') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUpdated } from 'vue'
import { UploadedImageModel } from '@/common/model'
import { store } from '@/store'
import { copyImageLink } from '@/utils'

const props = defineProps({
  imgObj: {
    type: Object,
    default: () => {}
  }
})

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const leftSideTip = computed(() => {
  if (userSettings.imageLinkFormat.enable) {
    return `${userSettings.imageLinkType.selected} & ${userSettings.imageLinkFormat.selected}`
  }
  return `${userSettings.imageLinkType.selected}`
})

let img = ref(props.imgObj as UploadedImageModel).value

const oneClickCopy = () => {
  copyImageLink(img, userConfigInfo, userSettings)
}

onUpdated(() => {
  img = props.imgObj as UploadedImageModel
})
</script>

<style scoped lang="stylus">
@import "copy-image-link.styl"
</style>
