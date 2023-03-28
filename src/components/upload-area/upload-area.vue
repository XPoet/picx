<template>
  <div
    class="upload-area active-upload"
    :class="{ focus: uploadAreaActive }"
    @dragover.prevent
    @drop.stop.prevent="onDrop"
    @paste.stop="onPaste"
    v-loading="imageLoading"
    element-loading-text="图片上传中..."
    element-loading-background="rgba(0, 0, 0, 0.5)"
  >
    <label for="img-file-selecter" class="active-upload" v-if="uploadAreaActive"></label>
    <input id="img-file-selecter" type="file" @change="onSelect" multiple="multiple" />
    <div class="upload-area-tips" v-if="!toUploadImage.curImgBase64Url">
      <el-icon class="icon"><UploadFilled /></el-icon>
      <div class="text">拖拽 / 粘贴 / 点击此处选择图片</div>
    </div>
    <img
      class="preview-img"
      v-if="toUploadImage.curImgBase64Url"
      :src="toUploadImage.curImgBase64Url"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useStore } from '@/store'
import {
  compressImgLoading,
  createToUploadImageObject,
  filenameHandle,
  isImage,
  selectedFileHandle
} from '@/utils'

defineProps({
  imageLoading: {
    type: Boolean,
    default: false
  }
})

const store = useStore()

const userSettings = computed(() => store.getters.getUserSettings).value
const uploadAreaActive = computed((): boolean => store.getters.getUploadAreaActive)
const toUploadImage = computed(() => store.getters.getToUploadImage).value

const preUploadHandle = (base64Data: string, originFile: File, compressFile?: File) => {
  if (
    toUploadImage.list.length === toUploadImage.uploadedNumber &&
    toUploadImage.list.length > 0 &&
    toUploadImage.uploadedNumber > 0
  ) {
    store.dispatch('TO_UPLOAD_IMAGE_CLEAN_LIST')
    store.dispatch('TO_UPLOAD_IMAGE_CLEAN_UPLOADED_NUMBER')
  }

  const { defaultHash, isCompress, defaultPrefix, prefixName } = userSettings
  const file = isCompress ? compressFile : originFile
  const curImg = createToUploadImageObject()

  curImg.imgData.base64Url = base64Data
  // eslint-disable-next-line prefer-destructuring
  curImg.imgData.base64Content = base64Data.split(',')[1]

  const { name, hash, suffix } = filenameHandle(file?.name)
  curImg.uuid = hash
  curImg.fileInfo.compressedSize = compressFile?.size
  curImg.fileInfo.originSize = originFile.size
  curImg.fileInfo.size = file?.size
  curImg.fileInfo.lastModified = file?.lastModified

  curImg.filename.initName = name
  curImg.filename.name = defaultPrefix ? `${prefixName}${name}` : name
  curImg.filename.prefixName = prefixName
  curImg.filename.hash = hash
  curImg.filename.suffix = suffix
  curImg.filename.final = defaultHash
    ? `${curImg.filename.name}.${hash}.${suffix}`
    : `${curImg.filename.name}.${suffix}`
  curImg.filename.isHashRename = defaultHash
  curImg.filename.isPrefix = defaultPrefix

  store.dispatch('TO_UPLOAD_IMAGE_LIST_ADD', JSON.parse(JSON.stringify(curImg)))
  store.dispatch('TO_UPLOAD_IMAGE_SET_CURRENT', {
    uuid: hash,
    base64Url: base64Data
  })
}

const unifiedHandler = async (files: any[]) => {
  store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
  const { isCompress } = userSettings
  let loading = null
  if (isCompress) {
    loading = compressImgLoading()
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const res = await selectedFileHandle(file)
    if (res) {
      preUploadHandle(res.base64, res.originalFile, res.compressFile)
    }
  }
  if (isCompress && loading) {
    loading.close()
  }
}

// Select images
const onSelect = async (e: any) => {
  await unifiedHandler(e.target.files)
}

// Drop images
const onDrop = async (e: any) => {
  await unifiedHandler(e.dataTransfer.files)
}

// Paste images
const onPaste = async (e: any) => {
  const files = Array.from(e.clipboardData.items)
    .filter((v: any) => v.kind === 'file' && isImage(v.type))
    .map((x: any) => x.getAsFile())
  await unifiedHandler(files)
}

onMounted(() => {
  window.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', onPaste)
})
</script>

<style scoped lang="stylus">
@import "upload-area.styl"
</style>
