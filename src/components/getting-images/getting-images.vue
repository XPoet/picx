<template>
  <div
    class="getting-images-container"
    :class="{ focus: uploadAreaActive && curImgBase64 }"
    @dragover.prevent
    @drop.stop.prevent="onDrop"
    @paste.stop="onPaste"
  >
    <label for="input-file-selector"></label>
    <input
      id="input-file-selector"
      type="file"
      accept="image/*"
      @change="onSelect"
      multiple="multiple"
    />
    <div class="upload-area-tips" v-if="!curImgBase64">
      <el-icon class="icon"><UploadFilled /></el-icon>
      <div class="text">拖拽 / 粘贴 / 点击此处选择图片</div>
    </div>
    <img class="preview-img" v-if="curImgBase64" :src="curImgBase64" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useStore } from '@/store'
import { gettingImagesHandle, isImage } from '@/utils'
import { ImageHandleResult } from '@/common/model'

const store = useStore()

const uploadAreaActive = computed((): boolean => store.getters.getUploadAreaActive)

const curImgBase64 = ref<string>('')
const imgList = ref<ImageHandleResult[]>([])

const emit = defineEmits(['getImgList'])

const unifiedHandle = async (files: File[]) => {
  if (!files.length) {
    return
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const res = await gettingImagesHandle(file)
    if (res) {
      imgList.value.push(res)
    }
  }
  curImgBase64.value = imgList.value[imgList.value.length - 1].base64
  store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
  emit('getImgList', imgList.value)
}

const onSelect = async (e: any) => {
  const input = e.target
  await unifiedHandle(input.files)
  input.value = '' // 清空 input 元素的 value 属性，强制每次触发 onchange 事件
  input.value = input.defaultValue
}

const onDrop = async (e: any) => {
  await unifiedHandle(e.dataTransfer.files)
}

const onPaste = async (e: any) => {
  const files = Array.from(e.clipboardData.items)
    .filter((v: any) => v.kind === 'file' && isImage(v.type))
    .map((x: any) => x.getAsFile())
  await unifiedHandle(files)
}

const reset = () => {
  imgList.value = []
  curImgBase64.value = ''
}

onMounted(() => {
  window.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', onPaste)
})

defineExpose({ reset })
</script>

<style scoped lang="stylus">
@import "./getting-images.styl"
</style>
