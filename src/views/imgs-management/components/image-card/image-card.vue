<script setup lang="ts">
import type { UploadedImageModel } from '@/common/model'
import { computed, ref } from 'vue'
import { ContextmenuEnum } from '@/common/directive/types'
import { ImageLinkTypeEnum } from '@/common/model'
import { store } from '@/stores'
import { copyImageLink, generateImageLink, isVideo } from '@/utils'

const props = defineProps({
  imageObj: {
    type: Object as () => UploadedImageModel,
    default: () => ({}),
  },
  isUploaded: {
    type: Boolean,
    default: false,
  },
})

const userSettings = computed(() => store.getters.getUserSettings).value
const imgUrl = computed(() => generateImageLink(props.imageObj) ?? undefined)

const isVideoFile = computed(() => isVideo(props.imageObj.name))
const isShowVideoPreview = ref(false)

const noneDeployed = computed(() => {
  return (
    userSettings.imageLinkType.selected === ImageLinkTypeEnum.GitHubPages
    && props.imageObj.deployed === false
  )
})

const isShowOperateBtn = ref<boolean>(false)

const togglePick = (imageObj: UploadedImageModel) => {
  imageObj.checked = !imageObj.checked
  store.commit('IMAGE_CARD', { imageObj })
}

const onShiftClick = (imageObj: UploadedImageModel) => {
  togglePick(imageObj)
}

const setDeployStatus = (status: boolean) => {
  // eslint-disable-next-line vue/no-mutating-props
  props.imageObj.deployed = status
}
</script>

<template>
  <div
    v-loading="imageObj.deleting"
    v-contextmenu="{ type: ContextmenuEnum.img, img: imageObj }"
    class="image-card border-box"
    :class="{ checked: imageObj.checked, active: imageObj.active }"
    :element-loading-text="$t('management_page.loadingTxt3')"
    @mouseenter="isShowOperateBtn = true"
    @mouseleave="isShowOperateBtn = false"
    @click.shift="onShiftClick(imageObj)"
  >
    <!-- 图片 / 视频 -->
    <div class="image-card-top border-box">
      <div
        v-if="isVideoFile"
        class="video-thumb-box"
        role="button"
        tabindex="0"
        :aria-label="$t('management_page.video_preview')"
        @click.stop="isShowVideoPreview = true"
        @keydown.enter.prevent="isShowVideoPreview = true"
        @keydown.space.prevent="isShowVideoPreview = true"
      >
        <video class="video-thumb" :src="imgUrl" preload="metadata" muted />
        <el-icon class="video-play-badge" :size="24">
          <IEpVideoPlay />
        </el-icon>
      </div>
      <el-image
        v-else
        :src="imgUrl"
        fit="cover"
        loading="lazy"
        lazy
        :hide-on-click-modal="true"
        :preview-src-list="
          store.getters.getUploadAreaState.pressShiftKey || !imgUrl ? [] : [imgUrl]
        "
        @error="setDeployStatus(false)"
        @load="setDeployStatus(true)"
      />
    </div>

    <!-- 图片名称 & 复制链接 -->
    <div class="image-card-bottom border-box">
      <!-- 文件名 -->
      <div class="filename text-ellipsis border-box">
        {{ imageObj.name }}
      </div>

      <!-- 复制图片链接 -->
      <div
        class="copy-link text-ellipsis border-box"
        :class="{ disabled: noneDeployed }"
        @click="copyImageLink(imageObj)"
      >
        {{ $t('copy_link') }}
      </div>
    </div>

    <!-- 选择框 -->
    <div
      v-show="isShowOperateBtn || imageObj.checked"
      class="checked-box flex-center"
      @click="togglePick(imageObj)"
    >
      <el-icon v-if="imageObj.checked" :size="14">
        <IEpSelect />
      </el-icon>
    </div>

    <!-- 部署状态 -->
    <div v-if="noneDeployed" class="deploy-status-box">
      <el-tag type="danger" disable-transitions>
        {{ $t('settings_page.image_hosting_deploy.not_deployed') }}
      </el-tag>
    </div>

    <!-- 视频预览弹窗 -->
    <el-dialog
      v-model="isShowVideoPreview"
      class="video-preview-dialog"
      append-to-body
      align-center
      destroy-on-close
      width="min(720px, 92vw)"
    >
      <video class="video-preview" :src="imgUrl" controls autoplay />
    </el-dialog>
  </div>
</template>

<style scoped lang="stylus">
@import 'image-card.styl'
</style>
