<template>
  <div class="copy-image-link-box border-box">
    <el-tooltip :content="imgLinkRuleTip" placement="top">
      <el-button plain type="primary" size="default" @click="oneClickCopy">
        <el-icon><IEpCopyDocument /></el-icon>&nbsp;{{ $t('upload.copyLink') }}
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUpdated } from 'vue'
import { UploadedImageModel } from '@/common/model'
import { store } from '@/stores'
import { copyImageLink } from '@/utils'

const props = defineProps({
  imgObj: {
    type: Object,
    default: () => {}
  }
})

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const imgLinkRuleTip = computed(() => {
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
