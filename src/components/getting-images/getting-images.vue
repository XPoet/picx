<template>
  <div
    class="getting-images-container"
    :class="{ focus: uploadAreaState.isActive && curShowImg.base64, disabled: disabled }"
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
    <div class="upload-area-tips" v-if="!curShowImg.base64">
      <el-icon class="icon"><IEpUploadFilled /></el-icon>
      <div class="text">{{ $t('upload_page.upload_area_text') }}</div>
    </div>
    <img class="preview-img" v-if="curShowImg.base64" :src="curShowImg.base64" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useStore } from '@/stores'
import { gettingFilesHandle, isImage } from '@/utils'
import { ImageHandleResult } from '@/common/model'

const store = useStore()

const uploadAreaState = computed(() => store.getters.getUploadAreaState)

const curShowImg = ref<{ uuid: string; base64: string }>({
  uuid: '',
  base64: ''
})
const imgList = ref<ImageHandleResult[]>([])

const emit = defineEmits(['getImgList'])

defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const setCurImg = () => {
  const len = imgList.value.length
  const tmpImg = len > 0 ? imgList.value[len - 1] : { uuid: '', base64: '' }
  curShowImg.value = {
    uuid: tmpImg.uuid,
    base64: tmpImg.base64
  }
}

const unifiedHandle = async (files: File[]) => {
  if (!files.length) {
    return
  }

  imgList.value = []

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const res = await gettingFilesHandle(file)
    if (res) {
      imgList.value.push(res)
    }
  }

  setCurImg()

  store.commit('SET_UPLOAD_AREA_STATE', {
    isActive: true
  })

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
  curShowImg.value.uuid = ''
  curShowImg.value.base64 = ''
}

const remove = (uuid: string) => {
  const rmIdx = imgList.value.findIndex((v) => v.uuid === uuid)
  if (rmIdx !== -1) {
    imgList.value.splice(rmIdx, 1)
  }

  if (uuid === curShowImg.value.uuid) {
    setCurImg()
  }
}

onMounted(() => {
  window.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', onPaste)
})

defineExpose({ reset, remove })
</script>

<style scoped lang="stylus">
@import "./getting-images.styl"
</style>
