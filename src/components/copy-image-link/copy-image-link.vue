<template>
  <div class="copy-image-link-box">
    <div class="left">
      <el-icon><InfoFilled /></el-icon>
    </div>
    <div class="btn-box right">
      <el-tooltip
        :content="'点击复制 ' + userSettings.imageLinkType.selected + ' CDN 外链'"
        placement="top"
      >
        <span class="btn-item copy-url flex-center" @click="oneClickCopy"> 一键复制 </span>
      </el-tooltip>
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

let img = ref(props.imgObj as UploadedImageModel).value

const oneClickCopy = () => {
  copyImageLink(img.path, userSettings.imageLinkType, userConfigInfo)
}

onUpdated(() => {
  img = props.imgObj as UploadedImageModel
})
</script>

<style scoped lang="stylus">
@import "copy-image-link.styl"
</style>
