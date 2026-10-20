<template>
  <article class="upload-image-card-container" :class="phase" :data-uuid="imgObj.uuid">
    <div class="queue-media-line">
      <button class="media-thumbnail" type="button" :disabled="disabled" :title="$t('upload_workspace.details_name', { name: imgObj.filename.final })" @click="details">
        <video v-if="video" :src="src" muted preload="metadata" />
        <img v-else :src="src" alt="" loading="lazy">
        <span v-if="video" class="video-label">MP4</span>
      </button>
      <div class="queue-file-info">
        <strong class="queue-filename" :title="imgObj.filename.final">{{ imgObj.filename.final }}</strong>
        <div class="queue-file-size">
          <template v-if="compressed">
            <span>{{ formatFileBytes(imgObj.fileInfo.originalFile?.size) }}</span>
            <PicxIcon name="arrow-right" :size="12" />
          </template>

          <strong v-if="compressed">
            {{ formatFileBytes(uploaded ? imgObj.uploadedImg?.size : finalUploadFile(imgObj)?.size) }}
          </strong>
          <template v-else>
            <span>{{ formatFileBytes(uploaded ? imgObj.uploadedImg?.size : finalUploadFile(imgObj)?.size) }}</span>
            <span>·</span><span>{{ $t('upload_workspace.size_unchanged') }}</span>
          </template>
        </div>
        <span class="queue-status" role="status">
          <ElIcon v-if="imgObj.uploadStatus.uploading && !uploaded" class="is-loading" :size="12">
            <PicxIcon :name="statusIcon" :size="12" />
          </ElIcon>
          <PicxIcon v-else :name="statusIcon" :size="12" />
          <span>{{ $t(`upload_workspace.status_${phase}`) }}</span>
        </span>
      </div>
      <div class="queue-actions">
        <el-button v-if="uploaded" text native-type="button" :title="$t('upload_workspace.copy_name', { name: imgObj.filename.final })" @click="$emit('copy', imgObj.uuid)">
          <PicxIcon name="copy" :size="18" />
        </el-button>
        <el-button v-if="phase === 'failed' && !uploadFailure" text native-type="button" :disabled="disabled" :title="$t('upload_workspace.retry_processing')" @click="$emit('retry', imgObj.uuid)">
          <PicxIcon name="refresh-cw" :size="18" />
        </el-button>
        <el-button v-if="!uploaded" class="queue-remove" text native-type="button" :disabled="disabled" :title="$t('upload_workspace.remove_name', { name: imgObj.filename.final })" @click="$emit('remove', imgObj.uuid)">
          <PicxIcon name="x" :size="16" />
        </el-button>
      </div>
    </div>
    <p v-if="phase === 'failed'" class="queue-note" role="alert">
      {{ uploadFailure ? $t(`request_error.${uploadFailure}`) : $t('upload_workspace.processing_failed') }}
    </p>
  </article>
  <el-dialog v-model="visible" draggable :title="$t('upload_workspace.details')" width="880px" class="upload-item-detail" append-to-body>
    <div class="upload-item-detail__preview">
      <video v-if="video" :src="visible ? src : undefined" controls preload="metadata" />
      <img v-else :src="visible ? src : undefined" :alt="imgObj.filename.final">
    </div>
    <div class="upload-item-detail__info">
      <p class="upload-item-detail__name">
        {{ imgObj.filename.final }}
      </p>
      <dl class="upload-item-detail__sizes">
        <div>
          <dt>{{ $t('upload_workspace.original_size') }}</dt>
          <dd>{{ formatFileBytes(imgObj.fileInfo.originalFile?.size) }}</dd>
        </div>
        <div>
          <dt>{{ $t('upload_workspace.final_size') }}</dt>
          <dd>{{ formatFileBytes(uploaded ? imgObj.uploadedImg?.size : finalUploadFile(imgObj)?.size) }}</dd>
        </div>
      </dl>
    </div>
    <el-form v-if="!uploaded" class="upload-item-detail__form" label-position="top" @submit.prevent="save">
      <div class="upload-item-detail__options">
        <el-checkbox v-model="draft.isRename" :disabled="disabled || naming.enableTimestamp">
          {{ $t('rename') }}
        </el-checkbox>
        <el-checkbox v-model="draft.isAddHash" :disabled="disabled || naming.enableTimestamp">
          {{ $t('upload_page.add_hash') }}
        </el-checkbox>
      </div>
      <el-form-item v-if="draft.isRename" :label="$t('upload_workspace.new_name')" :for="`${formId}-name`" :error="validDraft ? undefined : $t('upload_workspace.invalid_name')">
        <el-input :id="`${formId}-name`" v-model="draft.newName" :disabled="disabled || naming.enableTimestamp" :maxlength="RENAME_MAX_LENGTH">
          <template v-if="imgObj.filename.suffix" #append>
            .{{ imgObj.filename.suffix }}
          </template>
        </el-input>
      </el-form-item>
      <p v-if="naming.enableTimestamp" class="upload-item-detail__hint">
        {{ $t('upload_workspace.timestamp_exclusive') }}
      </p>
      <div class="upload-item-detail__result" role="status">
        <span>{{ $t('upload_workspace.filename_preview') }}</span>
        <strong>{{ previewName }}</strong>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">
        {{ $t('clipboard.close') }}
      </el-button>
      <el-button v-if="!uploaded" type="primary" :disabled="disabled || !validDraft" @click="save">
        {{ $t('upload_workspace.save_name') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/* eslint vue/block-order: ["error", { order: ["template", "script", "style"] }] */
import type { UploadImageModel, UserSettingsModel } from '@/common/model'
import type { QueueItemRuntime } from '@/common/model/upload'
import type { PicxIconName } from '@/components/picx-icon/types'
import { ElIcon } from 'element-plus'
import { computed, reactive, ref, useId } from 'vue'
import { RENAME_MAX_LENGTH } from '@/common/constant'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { formatFileBytes, isVideo } from '@/utils/file-utils'
import { applyUploadNaming, finalUploadFile } from '@/utils/upload-naming'

const props = defineProps<{ imgObj: UploadImageModel, runtime?: QueueItemRuntime, naming: UserSettingsModel['imageName'], disabled: boolean }>()
const emit = defineEmits<{
  remove: [uuid: string]
  copy: [uuid: string]
  retry: [uuid: string]
  editName: [uuid: string, override: NonNullable<UploadImageModel['namingOverrides']>]
}>()
const formId = useId()
const visible = ref(false)
const draft = reactive({ isRename: false, newName: '', isAddHash: false })
const uploaded = computed(() => props.imgObj.uploadStatus.progress === 100)
const video = computed(() => isVideo(props.imgObj.fileInfo.originalFile?.type ?? ''))
const src = computed(() => props.imgObj.base64.compressBase64 || props.imgObj.base64.watermarkBase64 || props.imgObj.base64.originalBase64)
const compressed = computed(() => props.imgObj.fileInfo.compressFile !== null)
const phase = computed(() => uploaded.value ? 'uploaded' : props.imgObj.uploadStatus.uploading ? 'uploading' : props.runtime?.phase === 'uploading' ? 'confirming' : props.runtime?.phase ?? 'processing')
const statusIcons: Record<QueueItemRuntime['phase'] | 'confirming', PicxIconName> = { uploaded: 'circle-check', uploading: 'loader-circle', confirming: 'clock-3', processing: 'loader-circle', failed: 'triangle-alert', ready: 'clock-3' }
const statusIcon = computed(() => statusIcons[phase.value])
const uploadFailure = computed(() => props.runtime?.phase === 'failed' && props.runtime.source === 'upload' ? props.runtime.result.error.kind : null)
const validDraft = computed(() => !draft.isRename || (!!draft.newName.trim() && !/[\\/\n\r]/.test(draft.newName)))
const previewName = computed(() => {
  const item = { ...props.imgObj, filename: { ...props.imgObj.filename }, namingOverrides: { ...props.imgObj.namingOverrides, ...draft } }
  applyUploadNaming(item, props.naming)
  return item.filename.final
})
function details() {
  if (props.disabled)
    return
  Object.assign(draft, {
    isRename: props.imgObj.filename.isRename,
    newName: props.imgObj.filename.newName,
    isAddHash: props.imgObj.filename.isAddHash,
  })
  visible.value = true
}
function save() {
  if (uploaded.value || props.disabled || !validDraft.value)
    return
  emit('editName', props.imgObj.uuid, { ...draft })
  visible.value = false
}
</script>

<style lang="stylus">
@import "./upload-image-card.styl"
</style>
