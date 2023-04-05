<template>
  <div class="compress-tool-container">
    <div v-if="imgList.length" class="compress-tool-left">
      <img-process-state-card v-for="img in imgList" :img-obj="img" :key="img.uuid" />
    </div>
    <div class="compress-tool-right" :class="{ 'no-img': !imgList.length }">
      <getting-images ref="gettingImagesRef" @getImgList="getImgList"></getting-images>

      <div class="compress-config">
        <div class="img-encoder-title">选择图片压缩算法：</div>
        <el-radio-group class="img-encoder-group" v-model="compressEncoder">
          <el-radio :label="CompressEncoderEnum.webP">
            {{ CompressEncoderEnum.webP }}
            <span class="desc">压缩后图片格式为 webp，压缩率较高，大多数浏览器支持</span>
          </el-radio>
          <el-radio :label="CompressEncoderEnum.avif">
            {{ CompressEncoderEnum.avif }}
            <span class="desc">压缩后图片格式为 avif，压缩率极高，部分现代浏览器支持</span>
          </el-radio>
          <el-radio :label="CompressEncoderEnum.mozJPEG">
            {{ CompressEncoderEnum.mozJPEG }}
            <span class="desc">压缩后图片格式为 jpg，压缩率一般，所有浏览器支持</span>
          </el-radio>
        </el-radio-group>
      </div>

      <div class="user-operate" :class="{ compressed: isCompressed && imgList.length > 1 }">
        <el-button v-if="isCompressed && imgList.length > 1" plain type="success" @click="download">
          批量下载
        </el-button>
        <div>
          <el-button v-if="imgList.length" plain type="warning" @click="reset"> 重置 </el-button>
          <el-button
            v-if="imgList.length"
            :disabled="compressing || isCompressed"
            plain
            type="primary"
            @click="compress"
          >
            压缩
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CompressEncoderEnum, ImageHandleResult, ImgProcessStateModel } from '@/common/model'
import { compressImage, downloadImage, getFileSize, imgFileToBase64 } from '@/utils'

const gettingImagesRef = ref<any>(null)

const imgList = ref<ImgProcessStateModel[]>([])

const compressing = ref<boolean>(false)
const isCompressed = ref<boolean>(false)

const getImgList = (imgs: ImageHandleResult[]) => {
  isCompressed.value = false
  compressing.value = false
  imgList.value = imgs.map((x) => ({
    uuid: x.uuid,
    originalName: x.name,
    originalSize: x.size,
    originalBase64: x.base64,
    originalFile: x.file
  }))
}

const compressEncoder = ref<CompressEncoderEnum>(CompressEncoderEnum.webP)

const reset = () => {
  imgList.value.length = 0
  compressEncoder.value = CompressEncoderEnum.webP
  isCompressed.value = false
  gettingImagesRef.value?.reset()
}

const compress = async () => {
  compressing.value = true
  // eslint-disable-next-line no-restricted-syntax
  for (const img of imgList.value) {
    img.processing = true
    img.finialFile = await compressImage(img.originalFile, compressEncoder.value)
    img.finialBase64 = (await imgFileToBase64(img.finialFile)) || ''
    img.finialSize = getFileSize(img.finialBase64.length)
    img.finialName = img.finialFile.name
    img.processing = false
  }
  isCompressed.value = true
  compressing.value = false
}

const download = () => {
  imgList.value.forEach((v) => {
    downloadImage(v.finialFile as File)
  })
}
</script>

<style scoped lang="stylus">
@import "./compress-tool.styl"
</style>
