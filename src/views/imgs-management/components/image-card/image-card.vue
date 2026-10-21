<template>
  <article v-loading="loading || imageObj.deleting" v-contextmenu="{ type: ContextmenuEnum.img, img: imageObj }" :element-loading-text="loadingText" class="image-card" :class="{ checked: selected }" :title="imageObj.name">
    <div class="media-thumbnail">
      <el-button ref="previewButton" class="image-preview" :title="$t('management_page.workspace.previewMedia', { name: imageObj.name })" :disabled="busy || !imageUrl || failed" @click="showPreview = true">
        <video v-if="isVideo && imageUrl" :key="retryKey" :src="imageUrl" muted preload="metadata" playsinline @loadedmetadata="loaded" @error="loadFailed" />
        <img v-else-if="imageUrl" :key="`${imageUrl}-${retryKey}`" :src="imageUrl" alt="" loading="lazy" @load="loaded" @error="loadFailed">
        <PicxIcon v-if="isVideo && !failed" class="play-icon" name="play" :size="32" />
      </el-button>
      <label class="media-select">
        <input type="checkbox" :title="$t('management_page.workspace.selectMedia', { name: imageObj.name })" :checked="selected" :disabled="imageObj.deleting || busy" @change="select">
        <span><PicxIcon v-if="selected" name="check" :size="16" /></span>
        <span class="media-select-label">{{ $t('management_page.workspace.selectMedia', { name: imageObj.name }) }}</span>
      </label>
      <div v-if="failed || !imageUrl" class="media-error" role="status">
        <PicxIcon name="image" :size="28" />
        <span>{{ $t(`management_page.workspace.${imageUrl ? 'previewFailed' : 'invalidLink'}`) }}</span>
        <el-button v-if="imageUrl" :disabled="busy" @click="retry">
          {{ $t('management_page.workspace.retryPreview') }}
        </el-button>
      </div>
    </div>
    <div class="media-details">
      <el-button class="media-filename" :disabled="busy" :title="imageObj.name" @click="emit('action', 'property')">
        {{ imageObj.name }}
      </el-button>
      <p class="media-metadata">
        <span v-if="size">{{ size }}</span>
        <span v-if="dimensions">{{ dimensions.width }} × {{ dimensions.height }}</span>
        <span v-if="isVideo">{{ $t('management_page.workspace.video') }}</span>
      </p>
    </div>
    <div class="media-actions">
      <el-button class="copy-link" :loading="copying" :disabled="busy || !imageUrl" @click="emit('action', 'copy')">
        <PicxIcon name="link" :size="16" />{{ $t('management_page.workspace.copyLink') }}
      </el-button>
      <el-dropdown trigger="click" placement="bottom-end" @command="emit('action', $event)">
        <el-button class="media-more" :title="$t('management_page.workspace.moreMedia', { name: imageObj.name })" :disabled="busy">
          <PicxIcon name="ellipsis" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="action in menu" :key="action" :command="action">
              {{ $t(`management_page.workspace.${action}`) }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <el-image-viewer v-if="showPreview && !isVideo && imageUrl" :url-list="[imageUrl]" hide-on-click-modal @close="closePreview" />
    <el-dialog v-if="isVideo" v-model="showPreview" :title="imageObj.name" width="min(800px, 92vw)" append-to-body destroy-on-close @closed="closePreview">
      <video v-if="showPreview" class="video-preview" :src="imageUrl" controls playsinline preload="metadata" />
    </el-dialog>
  </article>
</template>

<script setup lang="ts">
/* eslint vue/block-order: ["error", { order: ["template", "script", "style"] }] */
import type { ButtonInstance } from 'element-plus/es/components/button/index'
import type { UploadedImageModel } from '@/common/model'
import type { ManagementMediaAction } from '@/common/model/management'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { ContextmenuEnum } from '@/common/directive/types'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { generateImageLink } from '@/utils/image-link-utils'

const props = withDefaults(defineProps<{ imageObj: UploadedImageModel, selected: boolean, busy?: boolean, loading?: boolean, loadingText?: string, copying?: boolean }>(), { busy: false })
const emit = defineEmits<{ select: [selected: boolean], action: [action: ManagementMediaAction], availability: [available: boolean] }>()
const previewButton = useTemplateRef<ButtonInstance>('previewButton')
const imageUrl = computed(() => generateImageLink(props.imageObj) ?? undefined)
const isVideo = computed(() => props.imageObj.type === 'video')
const failed = ref(false)
const retryKey = ref(0)
const dimensions = ref<{ width: number, height: number } | null>(null)
const showPreview = ref(false)
const size = computed(() => Number.isFinite(props.imageObj.size) && props.imageObj.size > 0 ? `${Number((props.imageObj.size / 1024).toFixed(2))} KB` : '')
const menu: ManagementMediaAction[] = ['property', 'rename', 'move', 'repository', 'delete']
watch(imageUrl, () => {
  failed.value = false
  dimensions.value = null
})
function loaded(event: Event) {
  const element = event.target
  const width = element instanceof HTMLVideoElement ? element.videoWidth : element instanceof HTMLImageElement ? element.naturalWidth : 0
  const height = element instanceof HTMLVideoElement ? element.videoHeight : element instanceof HTMLImageElement ? element.naturalHeight : 0
  dimensions.value = width > 0 && height > 0 ? { width, height } : null
  failed.value = false
  emit('availability', true)
}
function loadFailed() {
  dimensions.value = null
  failed.value = true
  emit('availability', false)
}
function select(event: Event) {
  if (event.target instanceof HTMLInputElement)
    emit('select', event.target.checked)
}
function retry() {
  failed.value = false
  retryKey.value += 1
}
async function closePreview() {
  showPreview.value = false
  await nextTick()
  previewButton.value?.ref?.focus()
}
</script>

<style scoped lang="stylus">
@import './image-card.styl'
</style>
