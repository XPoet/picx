<script setup lang="ts">
import type { UploadImageModel, UserSettingsModel } from '@/common/model'
import type { QueueItemRuntime } from '@/common/model/upload'
import type { PicxIconName } from '@/components/picx-icon/types'
import { ElIcon } from 'element-plus'
import { computed, reactive, ref, useId } from 'vue'
import { RENAME_MAX_LENGTH } from '@/common/constant'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { formatFileBytes, isVideo } from '@/utils/file-utils'
import { finalUploadFile } from '@/utils/upload-naming'

const props = defineProps<{ imgObj: UploadImageModel, runtime?: QueueItemRuntime, naming: UserSettingsModel['imageName'], disabled: boolean }>()
const emit = defineEmits<{
  remove: [uuid: string]
  copy: [uuid: string]
  retry: [uuid: string]
  editName: [uuid: string, override: NonNullable<UploadImageModel['namingOverrides']>]
}>()
const formId = useId()
const visible = ref(false)
const draft = reactive({ isRename: false, newName: '', isAddHash: false, isAddPrefix: false, prefix: '' })
const uploaded = computed(() => props.imgObj.uploadStatus.progress === 100)
const video = computed(() => isVideo(props.imgObj.fileInfo.originalFile?.type ?? ''))
const src = computed(() => props.imgObj.base64.compressBase64 || props.imgObj.base64.watermarkBase64 || props.imgObj.base64.originalBase64)
const compressed = computed(() => props.imgObj.fileInfo.compressFile !== null)
const phase = computed(() => uploaded.value ? 'uploaded' : props.imgObj.uploadStatus.uploading ? 'uploading' : props.runtime?.phase === 'uploading' ? 'confirming' : props.runtime?.phase ?? 'processing')
const statusIcons: Record<QueueItemRuntime['phase'] | 'confirming', PicxIconName> = { uploaded: 'circle-check', uploading: 'loader-circle', confirming: 'clock-3', processing: 'loader-circle', failed: 'triangle-alert', ready: 'clock-3' }
const statusIcon = computed(() => statusIcons[phase.value])
const uploadFailure = computed(() => props.runtime?.phase === 'failed' && props.runtime.source === 'upload' ? props.runtime.result.error.kind : null)
const validDraft = computed(() => (!draft.isRename || (!!draft.newName.trim() && !/[\\/\n\r]/.test(draft.newName))) && (!draft.isAddPrefix || !/[\\/\n\r]/.test(draft.prefix)))
function details() {
  if (props.disabled)
    return
  Object.assign(draft, {
    isRename: props.imgObj.filename.isRename,
    newName: props.imgObj.filename.newName,
    isAddHash: props.imgObj.filename.isAddHash,
    isAddPrefix: props.imgObj.filename.isAddPrefix,
    prefix: props.imgObj.filename.prefix,
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
  <el-dialog v-model="visible" :title="$t('upload_workspace.details')" width="720px" class="upload-item-detail" append-to-body>
    <video v-if="video" class="detail-preview" :src="visible ? src : undefined" controls preload="metadata" />
    <img v-else class="detail-preview" :src="visible ? src : undefined" :alt="imgObj.filename.final">
    <p class="detail-name">
      {{ imgObj.filename.final }}
    </p>
    <p>{{ $t('upload_workspace.original_size') }}: {{ formatFileBytes(imgObj.fileInfo.originalFile?.size) }} · {{ $t('upload_workspace.final_size') }}: {{ formatFileBytes(finalUploadFile(imgObj)?.size) }}</p>
    <form v-if="!uploaded" class="item-naming-form" @submit.prevent="save">
      <el-checkbox v-model="draft.isRename" :disabled="disabled || naming.enableTimestamp">
        {{ $t('rename') }}
      </el-checkbox>
      <label :for="`${formId}-name`">{{ $t('upload_workspace.new_name') }}</label>
      <input :id="`${formId}-name`" v-model="draft.newName" :disabled="disabled || !draft.isRename || naming.enableTimestamp" :maxlength="RENAME_MAX_LENGTH">
      <el-checkbox v-model="draft.isAddHash" :disabled="disabled || naming.enableTimestamp">
        {{ $t('upload_page.add_hash') }}
      </el-checkbox>
      <el-checkbox v-model="draft.isAddPrefix" :disabled="disabled || naming.enableTimestamp">
        {{ $t('upload_page.add_prefix') }}
      </el-checkbox>
      <label :for="`${formId}-prefix`">{{ $t('upload_workspace.prefix') }}</label>
      <input :id="`${formId}-prefix`" v-model="draft.prefix" :disabled="disabled || !draft.isAddPrefix || naming.enableTimestamp" :maxlength="RENAME_MAX_LENGTH">
      <p v-if="naming.enableTimestamp">
        {{ $t('upload_workspace.timestamp_exclusive') }}
      </p>
      <p v-if="!validDraft" role="alert">
        {{ $t('upload_workspace.invalid_name') }}
      </p>
    </form>
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

<style scoped lang="stylus">
@import "./upload-image-card.styl"
</style>

<style lang="stylus">
.upload-item-detail {
  .detail-preview {
    display block
    width 100%
    max-height 260px
    object-fit contain
    background var(--picx-color-surface-muted)
    border-radius var(--picx-radius-control)
  }

  .detail-name {
    font-weight 600
    overflow-wrap anywhere
  }

  p {
    font-size 14px
    line-height 1.6
  }

  .item-naming-form {
    display grid
    gap 8px

    input {
      box-sizing border-box
      width 100%
      min-height 44px
      padding 8px 12px
      color var(--picx-color-text)
      font-family inherit
      font-size 16px
      background var(--picx-color-surface)
      border 1px solid var(--picx-color-control-border)
      border-radius var(--picx-radius-control)
    }
  }
}
</style>
