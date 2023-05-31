<template>
  <div class="watermark-tool-container">
    <div v-if="imgList.length" class="watermark-tool-left">
      <img-process-state-card
        v-for="img in imgList"
        :img-obj="img"
        :key="img.uuid"
        card-type="watermark"
        @remove="remove"
      />
    </div>
    <div class="watermark-tool-right" :class="{ 'no-img': !imgList.length }">
      <getting-images ref="gettingImagesRef" @getImgList="getImgList"></getting-images>

      <watermark-config-box
        :isTool="true"
        @watermarkConfig="setWatermarkConfig"
        style="margin-top: 18rem"
      />

      <div class="user-operate" :class="{ watermarked: isWatermarked && imgList.length > 1 }">
        <el-button
          v-if="isWatermarked && imgList.length > 1"
          plain
          type="success"
          @click="download"
        >
          {{ $t('toolbox.batch_download') }}
        </el-button>
        <div>
          <el-button v-if="imgList.length" plain type="warning" @click="reset">
            {{ $t('reset') }}
          </el-button>
          <el-button
            v-if="imgList.length"
            :disabled="watermarking || isWatermarked || !watermarkConfig.text"
            plain
            type="primary"
            @click="addWatermark"
          >
            {{ $t('toolbox.add_watermark') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import {
  ImageHandleResult,
  ImgProcessStateModel,
  UserSettingsModel,
  WatermarkPositionEnum
} from '@/common/model'
import { addWatermarkToImage, downloadImage, imgFileToBase64 } from '@/utils'
import { useStore } from '@/stores'

const store = useStore()

const watermarkConfig = reactive<UserSettingsModel['watermark']>({
  enable: true,
  text: '',
  fontSize: 0,
  opacity: 0,
  position: WatermarkPositionEnum.rightBottom,
  textColor: ''
})

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

// 设置水印配置
const setWatermarkConfig = (config: UserSettingsModel['watermark']) => {
  watermarkConfig.text = config.text
  watermarkConfig.textColor = config.textColor
  watermarkConfig.opacity = config.opacity
  watermarkConfig.position = config.position
  watermarkConfig.fontSize = config.fontSize
  isWatermarked.value = false
}

// 重置
const reset = () => {
  store.dispatch('TOOLBOX_IMG_LIST_RESET')
  isWatermarked.value = false
  gettingImagesRef.value?.reset()
}

// 添加水印
const addWatermark = async () => {
  watermarking.value = true
  // eslint-disable-next-line no-restricted-syntax
  for (const img of imgList.value) {
    img.processing = true
    img.finialFile = (await addWatermarkToImage(img.originalFile, watermarkConfig)) as File
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
