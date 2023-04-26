<template>
  <div class="watermark-tool-container">
    <div v-if="imgList.length" class="watermark-tool-left">
      <img-process-state-card
        v-for="img in imgList"
        :img-obj="img"
        :key="img.uuid"
        @remove="remove"
      />
    </div>
    <div class="watermark-tool-right" :class="{ 'no-img': !imgList.length }">
      <getting-images ref="gettingImagesRef" @getImgList="getImgList"></getting-images>

      <watermark-config-box isTool="true" style="margin-top: 18rem" />

      <div class="user-operate" :class="{ watermarked: isWatermarked && imgList.length > 1 }">
        <el-button
          v-if="isWatermarked && imgList.length > 1"
          plain
          type="success"
          @click="download"
        >
          批量下载
        </el-button>
        <div>
          <el-button v-if="imgList.length" plain type="warning" @click="reset"> 重置 </el-button>
          <el-button
            v-if="imgList.length"
            :disabled="watermarking || isWatermarked || !watermark.text"
            plain
            type="primary"
            @click="addWatermark"
          >
            加水印
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ImageHandleResult, ImgProcessStateModel } from '@/common/model'
import { downloadImage, imgFileToBase64, addWatermarkToImage } from '@/utils'
import { useStore } from '@/store'

const store = useStore()

const userSettings = computed(() => store.getters.getUserSettings).value

const { watermark } = userSettings

const gettingImagesRef = ref<any>(null)

const imgList = ref<ImgProcessStateModel[]>([])

const watermarking = ref<boolean>(false)
const isWatermarked = ref<boolean>(false)

const getImgList = (imgs: ImageHandleResult[]) => {
  isWatermarked.value = false
  watermarking.value = false
  imgs.forEach((x) => {
    store.dispatch('TOOLBOX_IMG_LIST_ADD', {
      uuid: x.uuid,
      originalName: x.file.name,
      originalSize: x.file.size,
      originalBase64: x.base64,
      originalFile: x.file
    })
  })
}

// 重置
const reset = () => {
  store.dispatch('TOOLBOX_IMG_LIST_RESET')
  isWatermarked.value = false
  gettingImagesRef.value?.reset()
}

// 加水印
const addWatermark = async () => {
  watermarking.value = true
  // eslint-disable-next-line no-restricted-syntax
  for (const img of imgList.value) {
    img.processing = true
    img.finialFile = (await addWatermarkToImage(img.originalFile, watermark)) as File
    img.finialBase64 = (await imgFileToBase64(img.finialFile)) || ''
    img.finialSize = img.finialFile.size
    img.finialName = img.finialFile.name
    img.processing = false
  }
  isWatermarked.value = true
  watermarking.value = false
}

// 下载
const download = () => {
  imgList.value.forEach((v: ImgProcessStateModel) => {
    downloadImage(v.finialFile as File)
  })
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
    deep: true
  }
)
</script>

<style scoped lang="stylus">
@import "./watermark-tool.styl"
</style>
