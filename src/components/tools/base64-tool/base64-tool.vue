<script setup lang="ts">
import type { ImageHandleResult, ImgProcessStateModel } from '@/common/model'
import { ref, watch } from 'vue'
import { useStore } from '@/stores'

const store = useStore()

const gettingImagesRef = ref<any>(null)

const imgList = ref<ImgProcessStateModel[]>([])

const getImgList = (imgs: ImageHandleResult[]) => {
  imgs.forEach((x) => {
    store.dispatch('TOOLBOX_IMG_LIST_ADD', {
      uuid: x.uuid,
      originalName: x.file.name,
      originalSize: x.file.size,
      originalBase64: x.base64,
    })
  })
}

// 重置
const reset = () => {
  store.dispatch('TOOLBOX_IMG_LIST_RESET')
  gettingImagesRef.value?.reset()
}

// 删除
const remove = (uuid: string) => {
  store.dispatch('TOOLBOX_IMG_LIST_REMOVE', uuid)
  gettingImagesRef.value?.remove(uuid)
}

watch(
  () => store.state.toolboxImageListModule.toolboxImageList,
  (newValue) => {
    imgList.value = newValue
  },
  {
    immediate: true,
    deep: true,
  },
)
</script>

<template>
  <div class="base64-tool-container">
    <div v-if="imgList.length" class="base64-tool-left">
      <img-process-state-card
        v-for="img in imgList"
        :key="img.uuid"
        card-type="base64"
        :img-obj="img"
        @remove="remove"
      />
    </div>
    <div class="base64-tool-right" :class="{ 'no-img': !imgList.length }">
      <getting-images ref="gettingImagesRef" @get-img-list="getImgList" />

      <div class="user-operate">
        <el-button v-if="imgList.length" plain type="warning" @click="reset">
          {{ $t('reset') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "base64-tool.styl"
</style>
