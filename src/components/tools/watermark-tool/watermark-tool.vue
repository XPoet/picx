<script setup lang="ts">
import type { ImageHandleResult, ImgProcessStateModel, UserSettingsModel } from '@/common/model'
import { reactive, ref, watch } from 'vue'
import { WatermarkPositionEnum } from '@/common/model'
import { useStore } from '@/stores'
import { addWatermarkToImage, downloadImage, imgFileToBase64 } from '@/utils'

const store = useStore()

const watermarkConfig = reactive<UserSettingsModel['watermark']>({
  enable: true,
  text: '',
  fontSize: 0,
  opacity: 0,
  position: WatermarkPositionEnum.rightBottom,
  textColor: '',
  rotate: -20,
  gap: 80,
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
      originalFile: x.file,
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
  watermarkConfig.rotate = config.rotate
  watermarkConfig.gap = config.gap
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
    deep: true,
  },
)
</script>

<template>
  <div class="watermark-tool-container">
    <div v-if="imgList.length" class="watermark-tool-left">
      <img-process-state-card
        v-for="img in imgList"
        :key="img.uuid"
        :img-obj="img"
        card-type="watermark"
        @remove="remove"
      />
    </div>
    <div class="watermark-tool-right" :class="{ 'no-img': !imgList.length }">
      <getting-images ref="gettingImagesRef" @get-img-list="getImgList" />

      <watermark-config-box
        :is-tool="true"
        style="margin-top: 18rem"
        @watermark-config="setWatermarkConfig"
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

<style scoped lang="stylus">
@import "./watermark-tool.styl"
</style>
