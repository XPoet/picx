<template>
  <div class="compress-tool-container">
    <div v-if="imgList.length" class="compress-tool-left">
      <img-process-state-card
        v-for="img in imgList"
        :img-obj="img"
        :key="img.uuid"
        @remove="remove"
      />
    </div>
    <div class="compress-tool-right" :class="{ 'no-img': !imgList.length }">
      <getting-images ref="gettingImagesRef" @getImgList="getImgList"></getting-images>

      <compress-config-box
        ref="compressConfigBoxRef"
        style="margin-top: 18rem"
        @encoder="setCompressEncoder($event)"
      />

      <div class="user-operate" :class="{ compressed: isCompressed && imgList.length > 1 }">
        <el-button v-if="isCompressed && imgList.length > 1" plain type="success" @click="download">
          {{ $t('toolbox.batch_download') }}
        </el-button>
        <div>
          <el-button v-if="imgList.length" plain type="warning" @click="reset">
            {{ $t('reset') }}
          </el-button>
          <el-button
            v-if="imgList.length"
            :disabled="compressing || isCompressed"
            plain
            type="primary"
            @click="compress"
          >
            {{ $t('toolbox.compress') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CompressEncoderEnum, ImageHandleResult, ImgProcessStateModel } from '@/common/model'
import { compressImage, downloadImage, imgFileToBase64 } from '@/utils'
import { useStore } from '@/stores'

const store = useStore()

const gettingImagesRef = ref<any>(null)
const compressConfigBoxRef = ref<any>(null)

const imgList = ref<ImgProcessStateModel[]>([])
const compressEncoder = ref<CompressEncoderEnum>(CompressEncoderEnum.webP)

const compressing = ref<boolean>(false)
const isCompressed = ref<boolean>(false)

const getImgList = (imgs: ImageHandleResult[]) => {
  isCompressed.value = false
  compressing.value = false
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

const setCompressEncoder = (v: CompressEncoderEnum) => {
  isCompressed.value = false
  compressEncoder.value = v
}

// 重置
const reset = () => {
  store.dispatch('TOOLBOX_IMG_LIST_RESET')
  isCompressed.value = false
  gettingImagesRef.value?.reset()
  compressConfigBoxRef.value?.reset()
}

// 压缩
const compress = async () => {
  compressing.value = true
  // eslint-disable-next-line no-restricted-syntax
  for (const img of imgList.value) {
    img.processing = true
    img.finialFile = await compressImage(img.originalFile, compressEncoder.value)
    img.finialBase64 = (await imgFileToBase64(img.finialFile)) || ''
    img.finialSize = img.finialFile.size
    img.finialName = img.finialFile.name
    img.processing = false
  }
  isCompressed.value = true
  compressing.value = false
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
@import "./compress-tool.styl"
</style>
