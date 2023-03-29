<template>
  <div class="copy-image-link-box">
    <div class="left">
      <el-tooltip content="请在'我的设置'进行图片链接相关配置" placement="top">
        <el-icon><InfoFilled /></el-icon>
      </el-tooltip>
    </div>
    <div class="btn-box right">
      <el-tooltip
        :content="'点击复制 ' + userSettings.imageLinkType.selected + ' 图片链接'"
        placement="top"
      >
        <span class="btn-item flex-center" @click="oneClickCopy"> 复制链接 </span>
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
  copyImageLink(img, userConfigInfo, userSettings)
}

onUpdated(() => {
  img = props.imgObj as UploadedImageModel
})
</script>

<style scoped lang="stylus">
@import "copy-image-link.styl"
</style>
