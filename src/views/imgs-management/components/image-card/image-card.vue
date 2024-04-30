<template>
  <div
    class="image-card border-box"
    :class="{ checked: imageObj.checked, active: imageObj.active }"
    v-loading="imageObj.deleting"
    :element-loading-text="$t('management_page.loadingTxt3')"
    @mouseenter="isShowOperateBtn = true"
    @mouseleave="isShowOperateBtn = false"
    @click.shift="onShiftClick(imageObj)"
    v-contextmenu="{ type: ContextmenuEnum.img, img: imageObj }"
    ref="imageCardRef"
  >
    <!-- 图片 -->
    <div class="image-card-top border-box">
      <el-image
        :src="imgUrl"
        fit="cover"
        loading="lazy"
        lazy
        :hide-on-click-modal="true"
        :preview-src-list="store.getters.getUploadAreaState.pressShiftKey ? [] : [imgUrl!]"
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
      <el-icon :size="14" v-if="imageObj.checked"><IEpSelect /></el-icon>
    </div>

    <!-- 部署状态 -->
    <div class="deploy-status-box" v-if="noneDeployed">
      <el-tag type="danger" disable-transitions>
        {{ $t('settings_page.image_hosting_deploy.not_deployed') }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { store } from '@/stores'
import { ImageLinkTypeEnum, UploadedImageModel } from '@/common/model'
import { copyImageLink, generateImageLink } from '@/utils'
import { ContextmenuEnum } from '@/common/directive/types'

const props = defineProps({
  imageObj: {
    type: Object as () => UploadedImageModel,
    default: () => ({})
  },
  isUploaded: {
    type: Boolean,
    default: false
  }
})

const userSettings = computed(() => store.getters.getUserSettings).value
const imgUrl = computed(() => generateImageLink(props.imageObj))

const noneDeployed = computed(() => {
  return (
    userSettings.imageLinkType.selected === ImageLinkTypeEnum.GitHubPages &&
    props.imageObj.deployed === false
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

<style scoped lang="stylus">
@import 'image-card.styl'
</style>
