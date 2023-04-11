<template>
  <div class="upload-image-card-container">
    <div
      class="img-show-container"
      v-loading="
        imgObj.uploadStatus.uploading ||
        imgObj.beforeUploadStatus.compressing ||
        imgObj.beforeUploadStatus.watermarking
      "
    >
      <el-image
        :src="
          imgObj.base64.compressBase64 ||
          imgObj.base64.watermarkBase64 ||
          imgObj.base64.originalBase64
        "
        fit="cover"
        loading="lazy"
        data-fancybox="gallery"
      />
    </div>
    <div class="img-name-handle-container">
      <div class="img-name-box text-ellipsis">
        {{ imgObj.filename.final || imgObj.filename.name }}
      </div>
      <div class="img-name-operate-box" v-if="imgObj.uploadStatus.progress === 0">
        <!-- 哈希化 -->
        <div class="operate-item">
          <el-checkbox
            label="哈希化"
            v-model="nFilename.isHash"
            @change="hashRename($event, imgObj)"
          ></el-checkbox>
        </div>

        <!-- 重命名 -->
        <div class="operate-item">
          <el-checkbox label="重命名" v-model="nFilename.isRename" @change="onRename"></el-checkbox>
          <el-input
            class="rename-input"
            size="small"
            v-if="imgObj.filename.isRename"
            v-model="nFilename.newName"
            @input="onRename"
            ref="renameInputRef"
            clearable
          ></el-input>
        </div>

        <!-- 命名前缀 -->
        <div
          class="operate-item"
          v-if="
            !imgObj.filename.isRename &&
            userSettings.prefixNaming.enable &&
            userSettings.prefixNaming.prefix
          "
        >
          <el-checkbox
            label="命名前缀"
            v-model="nFilename.prefixNaming"
            @change="prefixNamingTrans($event, imgObj)"
          ></el-checkbox>
        </div>
      </div>
      <div class="img-size-box">
        <div>
          <span
            class="original-file-size file-size-item"
            :class="{ 'del-line': imgObj.fileInfo?.compressFile?.size }"
          >
            {{ getFileSize(imgObj.fileInfo.originalFile.size) }} KB
          </span>
          <span v-if="imgObj.fileInfo?.compressFile?.size" class="finial-file-size file-size-item">
            {{ getFileSize(imgObj.fileInfo?.compressFile?.size) }} KB
          </span>
        </div>
        <span class="file-size-item">
          {{ formatDatetime('yyyy-MM-dd hh:mm', imgObj.fileInfo.originalFile.lastModified) }}
        </span>
      </div>
    </div>
    <div
      class="operate-container flex-center"
      v-if="imgObj.uploadStatus.progress === 100"
      @click="oneClickCopy(imgObj)"
    >
      点击复制图片链接
    </div>
    <el-tooltip
      v-if="imgObj.uploadStatus.progress === 0"
      placement="top"
      :offset="8"
      content="删除"
    >
      <el-icon class="del-btn" @click="remove(imgObj.uuid)"><Remove /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { compressImage, copyImageLink, imgFileToBase64 } from '@/utils'
import { UploadImageModel } from '@/common/model'
import { useStore } from '@/store'
import { addWatermarkToImage } from '@/utils/add-watermark'
import { getFileSize } from '@/utils/file-utils'
import { formatDatetime } from '@/utils/common-utils'
import { hashRename, prefixNamingTrans, rename } from './upload-image-card.util'

const store = useStore()

const props = defineProps({
  imgObj: {
    type: Object as () => UploadImageModel,
    require: true,
    default: () => ({})
  }
})

const emit = defineEmits(['remove'])

const renameInputRef = ref<any>(null)

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const nFilename = reactive({
  isHash: false,
  prefixNaming: false,
  isRename: false,
  newName: ''
})

const remove = (uuid: string) => {
  emit('remove', uuid)
}

const onRename = () => {
  // eslint-disable-next-line vue/no-mutating-props
  props.imgObj.filename.newName = nFilename.newName
  setTimeout(() => {
    renameInputRef.value?.focus()
  }, 100)
  rename(nFilename.isRename, props.imgObj)
}

const oneClickCopy = (img: UploadImageModel) => {
  copyImageLink(img.uploadedImg!, userConfigInfo, userSettings)
}

const initSettings = async () => {
  /* eslint-disable vue/no-mutating-props */

  const { watermark, compress } = userSettings
  let file: File = props.imgObj.fileInfo.originalFile!

  // 添加水印
  if (watermark.enable && watermark.text && !props.imgObj.fileInfo.watermarkFile) {
    props.imgObj.beforeUploadStatus.watermarking = true
    props.imgObj.fileInfo.watermarkFile = await addWatermarkToImage(
      props.imgObj.fileInfo.originalFile!,
      watermark
    )
    file = props.imgObj.fileInfo.watermarkFile!
    props.imgObj.base64.watermarkBase64 = await imgFileToBase64(file)
    props.imgObj.beforeUploadStatus.watermarking = false
  }

  // 压缩图片
  if (compress.enable && !props.imgObj.fileInfo.compressFile) {
    props.imgObj.beforeUploadStatus.compressing = true
    props.imgObj.fileInfo.compressFile = await compressImage(file, compress.encoder)
    file = props.imgObj.fileInfo.compressFile!
    props.imgObj.base64.compressBase64 = await imgFileToBase64(file)
    props.imgObj.beforeUploadStatus.compressing = false
  }
}

const initFilenameHandle = () => {
  const { defaultHash: isHash, prefixNaming } = userSettings
  if (props.imgObj.uploadStatus.progress === 0) {
    props.imgObj.filename.isHashRename = isHash
    props.imgObj.filename.isPrefix = prefixNaming.enable
    props.imgObj.filename.prefixName = prefixNaming.prefix

    prefixNamingTrans(prefixNaming.enable, props.imgObj)
    hashRename(isHash, props.imgObj)

    nFilename.isHash = props.imgObj.filename.isHashRename
    nFilename.prefixNaming = props.imgObj.filename.isPrefix
    nFilename.isRename = props.imgObj.filename.isRename
    nFilename.newName = props.imgObj.filename.newName
  }
}

onMounted(() => {
  initFilenameHandle()
  initSettings()
})
</script>

<style scoped lang="stylus">
@import "./upload-image-card.styl"
</style>
