<script lang="ts" setup>
import { computed, PropType, ref } from 'vue'
import { UploadedVideoModel } from '@/common/model'
import { ContextmenuEnum } from '@/common/directive/types'
import { store } from '@/stores'
import { copyVideoLink, generateVideoLink } from '@/utils/video-utils'

const emits = defineEmits(['preview'])

const props = defineProps({
  videoObj: {
    type: Object as PropType<UploadedVideoModel>,
    default: () => {}
  }
})

const isShowOperateBtn = ref<boolean>(false)

const togglePick = (videoObj: UploadedVideoModel) => {
  videoObj.checked = !videoObj.checked
  store.commit('VIDEO_CARD', { videoObj })
}

const onShiftClick = (videoObj: UploadedVideoModel) => {
  togglePick(videoObj)
}

const noneDeployed = computed(() => {
  return props.videoObj.deployed === false
})

const videoUrl = computed(() => {
  return generateVideoLink(props.videoObj) || ''
})

const handlePreview = () => {
  emits('preview', { name: props.videoObj.name, url: videoUrl.value })
}
</script>

<template>
  <div
    class="video-card border-box"
    :class="{ checked: videoObj.checked, active: videoObj.active }"
    v-loading="videoObj.deleting"
    :element-loading-text="$t('management_page.loadingTxt3')"
    @mouseenter="isShowOperateBtn = true"
    @mouseleave="isShowOperateBtn = false"
    @click.shift="onShiftClick(videoObj)"
    v-contextmenu="{ type: ContextmenuEnum.video, video: videoObj }"
    ref="imageCardRef"
  >
    <!-- 图片 -->
    <div class="video-card-top border-box">
      <video class="video" :src="videoUrl" @click.stop="handlePreview" />
    </div>

    <!-- 视频名称 & 复制链接 -->
    <div class="video-card-bottom border-box">
      <!-- 文件名 -->
      <div class="filename text-ellipsis border-box">
        {{ videoObj.name }}
      </div>

      <!-- 复制视频链接 -->
      <div
        class="copy-link text-ellipsis border-box"
        :class="{ disabled: noneDeployed }"
        @click="copyVideoLink(videoObj)"
      >
        {{ $t('copy_video_link') }}
      </div>
    </div>

    <!-- 选择框 -->
    <div
      v-show="isShowOperateBtn || videoObj.checked"
      class="checked-box flex-center"
      @click="togglePick(videoObj)"
    >
      <el-icon :size="14" v-if="videoObj.checked"><IEpSelect /></el-icon>
    </div>

    <!-- 部署状态 -->
    <div class="deploy-status-box" v-if="noneDeployed">
      <el-tag type="danger" disable-transitions>
        {{ $t('settings_page.image_hosting_deploy.not_deployed') }}
      </el-tag>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import 'video-card.styl'
</style>
