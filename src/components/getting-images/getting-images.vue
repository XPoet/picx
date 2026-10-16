<script setup lang="ts">
import type { ImageHandleResult } from '@/common/model'
import { computed, onMounted, onUnmounted, ref, useId, useTemplateRef } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useStore } from '@/stores'
import { gettingFilesHandle, isImage, isVideo } from '@/utils'
import { workspaceInputBlocked } from '@/utils/workspace-input'

const props = withDefaults(defineProps<{
  disabled?: boolean
  videoEnabled?: boolean
  mode?: 'preview' | 'workspace'
  hasFiles?: boolean
}>(), { disabled: false, videoEnabled: false, mode: 'preview', hasFiles: false })
const emit = defineEmits<{ getImgList: [files: ImageHandleResult[]], receiving: [active: boolean] }>()
const store = useStore()
const inputId = useId()
const input = useTemplateRef<HTMLInputElement>('input')
const uploadAreaState = computed(() => store.getters.getUploadAreaState)
const acceptTypes = computed(() => props.videoEnabled ? 'image/*,video/mp4' : 'image/*')
const curShowImg = ref<ImageHandleResult | null>(null)
const imgList = ref<ImageHandleResult[]>([])
const dragging = ref(false)
let generation = 0
let disposed = false
const activeReads = new Set<symbol>()
const isVideoPreview = computed(() => curShowImg.value && isVideo(curShowImg.value.file.type))
const setCurImg = () => curShowImg.value = imgList.value.at(-1) ?? null

async function unifiedHandle(files: File[]) {
  if (props.disabled || disposed || !files.length)
    return
  const current = generation
  const read = Symbol('file-intake')
  activeReads.add(read)
  emit('receiving', true)
  try {
    const received: ImageHandleResult[] = []
    for (const file of files) {
      const result = await gettingFilesHandle(file, props.videoEnabled)
      if (props.disabled || current !== generation || disposed)
        return
      if (result)
        received.push(result)
    }
    if (!received.length)
      return
    if (props.mode === 'preview') {
      imgList.value = received
      setCurImg()
      store.commit('SET_UPLOAD_AREA_STATE', { isActive: true })
    }
    emit('getImgList', received)
  }
  finally {
    activeReads.delete(read)
    if (!disposed)
      emit('receiving', activeReads.size > 0)
  }
}

function selectFiles() {
  if (!props.disabled)
    input.value?.click()
}
function onSelect(event: Event) {
  if (!(event.target instanceof HTMLInputElement))
    return
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  void unifiedHandle(files)
}
function onDrop(event: DragEvent) {
  dragging.value = false
  void unifiedHandle(Array.from(event.dataTransfer?.files ?? []))
}
function onPaste(event: ClipboardEvent) {
  if (props.disabled || workspaceInputBlocked(event.target))
    return
  const files = Array.from(event.clipboardData?.items ?? [])
    .filter(item => item.kind === 'file' && isImage(item.type))
    .map(item => item.getAsFile())
    .filter((file): file is File => file !== null)
  if (files.length) {
    event.preventDefault()
    void unifiedHandle(files)
  }
}
function reset() {
  generation++
  activeReads.clear()
  emit('receiving', false)
  imgList.value = []
  curShowImg.value = null
}
function remove(uuid: string) {
  imgList.value = imgList.value.filter(item => item.uuid !== uuid)
  setCurImg()
}
onMounted(() => window.addEventListener('paste', onPaste))
onUnmounted(() => {
  disposed = true
  activeReads.clear()
  generation++
  window.removeEventListener('paste', onPaste)
})
defineExpose({ reset, remove, selectFiles })
</script>

<template>
  <div
    class="getting-images-container"
    :class="{ workspace: mode === 'workspace', focus: uploadAreaState.isActive && curShowImg, dragging, disabled }"
    :aria-disabled="disabled"
    @dragover.prevent="dragging = !disabled"
    @dragleave.prevent="dragging = false"
    @drop.stop.prevent="onDrop"
  >
    <input :id="inputId" ref="input" type="file" :disabled="disabled" :accept="acceptTypes" :aria-label="$t(videoEnabled ? 'upload_workspace.choose' : 'upload_workspace.choose_images')" multiple @change="onSelect">
    <template v-if="mode === 'workspace'">
      <span class="upload-symbol"><PicxIcon name="image-up" :size="28" /></span>
      <h2>{{ $t('upload_workspace.drop') }}</h2>
      <el-button type="primary" :disabled="disabled" @click="selectFiles">
        <PicxIcon name="upload" :size="18" />
        {{ $t(hasFiles ? 'upload_workspace.choose_more' : 'upload_workspace.choose') }}
      </el-button>
      <p>{{ $t('upload_workspace.accept') }}</p>
    </template>
    <template v-else>
      <label :for="inputId" class="preview-select" tabindex="0" :aria-label="$t('upload_workspace.choose_images')" @keydown.enter.prevent="selectFiles" @keydown.space.prevent="selectFiles" />
      <div v-if="!curShowImg" class="upload-area-tips">
        <PicxIcon name="image-up" :size="80" />
        <div class="text">
          {{ $t('upload_page.upload_area_text') }}
        </div>
      </div>
      <video v-else-if="isVideoPreview" class="preview-video" :src="curShowImg.base64" controls muted loop preload="metadata" />
      <img v-else class="preview-img" :src="curShowImg.base64" :alt="curShowImg.file.name">
    </template>
  </div>
</template>

<style scoped lang="stylus">
@import "./getting-images.styl"
</style>
