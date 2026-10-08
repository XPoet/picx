<script setup lang="ts">
import type { ImageHandleResult } from '@/common/model'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useStore } from '@/stores'
import { gettingFilesHandle, isImage, isVideo } from '@/utils'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  // 是否允许选择视频文件（默认只允许图片）
  videoEnabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['getImgList'])

const store = useStore()

const uploadAreaState = computed(() => store.getters.getUploadAreaState)

const acceptTypes = computed(() => (props.videoEnabled ? 'image/*,video/mp4' : 'image/*'))

const curShowImg = ref<ImageHandleResult | null>(null)
const imgList = ref<ImageHandleResult[]>([])

const isVideoPreview = computed(() => (curShowImg.value ? isVideo(curShowImg.value.file.type) : false))

const setCurImg = () => {
  const len = imgList.value.length
  curShowImg.value = len > 0 ? imgList.value[len - 1] : null
}

const unifiedHandle = async (files: File[]) => {
  if (!files.length) {
    return
  }

  imgList.value = []

  for (const file of files) {
    const res = await gettingFilesHandle(file, props.videoEnabled)
    if (res) {
      imgList.value.push(res)
    }
  }

  setCurImg()

  store.commit('SET_UPLOAD_AREA_STATE', {
    isActive: true,
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
  curShowImg.value = null
}

const remove = (uuid: string) => {
  const rmIdx = imgList.value.findIndex(v => v.uuid === uuid)
  if (rmIdx !== -1) {
    imgList.value.splice(rmIdx, 1)
  }

  if (curShowImg.value && uuid === curShowImg.value.uuid) {
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

<template>
  <div
    class="getting-images-container"
    :class="{ focus: uploadAreaState.isActive && curShowImg, disabled }"
    @dragover.prevent
    @drop.stop.prevent="onDrop"
    @paste.stop="onPaste"
  >
    <label for="input-file-selector" />
    <input id="input-file-selector" type="file" :accept="acceptTypes" multiple @change="onSelect">
    <div v-if="!curShowImg" class="upload-area-tips">
      <el-icon class="icon">
        <IEpUploadFilled />
      </el-icon>
      <div class="text">
        {{ $t('upload_page.upload_area_text') }}
      </div>
    </div>
    <video
      v-else-if="isVideoPreview"
      class="preview-video"
      :src="curShowImg.base64"
      controls
      muted
      loop
      preload="metadata"
    />
    <img v-else class="preview-img" :src="curShowImg.base64">
  </div>
</template>

<style scoped lang="stylus">
@import "./getting-images.styl"
</style>
