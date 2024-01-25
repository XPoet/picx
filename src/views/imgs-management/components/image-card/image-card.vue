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
    <div class="image-card-top border-box">
      <el-image
        :src="imgUrl"
        fit="cover"
        loading="lazy"
        lazy
        :hide-on-click-modal="true"
        :preview-src-list="store.getters.getUploadAreaState.pressShiftKey ? [] : [imgUrl!]"
      />
    </div>
    <div class="image-card-bottom border-box">
      <!-- 文件名 -->
      <div class="filename text-ellipsis border-box">
        {{ imageObj.name }}
      </div>

      <!-- 复制图片链接 -->
      <div class="copy-link text-ellipsis border-box" @click="copyImageLink(imageObj)">
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { store } from '@/stores'
import { UploadedImageModel } from '@/common/model'
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

const imgUrl = computed(() => generateImageLink(props.imageObj))

const isShowOperateBtn = ref<boolean>(false)

const togglePick = (imageObj: UploadedImageModel) => {
  imageObj.checked = !imageObj.checked
  store.commit('IMAGE_CARD', { imageObj })
}

const onShiftClick = (imageObj: UploadedImageModel) => {
  togglePick(imageObj)
}
</script>

<style scoped lang="stylus">
@import 'image-card.styl'
</style>
