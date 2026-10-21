<script setup lang="ts">
import type { UserSettingsModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import { computed, useId } from 'vue'
import ImageLinkPreview from '@/components/image-link-preview/image-link-preview.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import SettingsSyncFeedback from '@/components/settings-sync-feedback.vue'

const props = defineProps<{
  settings: UserSettingsModel
  target: RepositoryIdentity | null
  directory: string
  displayPath: string
  pendingCount: number
  pendingBytes: number | null
  uploadedCount: number
  hasItems: boolean
  busy: boolean
  processing: boolean
  canUpload: boolean
  shortcut: string
}>()
defineEmits<{
  compress: [enabled: boolean]
  watermark: [enabled: boolean]
  format: [format: string]
  directory: []
  reset: []
  upload: []
  copyAll: []
}>()
const formatId = useId()
const selectedFormat = computed(() => props.settings.imageLinkFormat.enable ? props.settings.imageLinkFormat.selected : 'raw')
</script>

<template>
  <aside class="upload-settings-panel">
    <h2>{{ $t('upload_workspace.settings') }}</h2>
    <div class="preference-switch">
      <label :for="`${formatId}-compress`">{{ $t('upload_workspace.auto_compress') }}</label>
      <el-switch :id="`${formatId}-compress`" :model-value="settings.compress.enable" :disabled="busy" @update:model-value="$emit('compress', $event === true)" />
    </div>
    <div class="preference-switch">
      <label :for="`${formatId}-watermark`">{{ $t('upload_workspace.add_watermark') }}</label>
      <el-switch :id="`${formatId}-watermark`" :model-value="settings.watermark.enable" :disabled="busy" @update:model-value="$emit('watermark', $event === true)" />
    </div>
    <div class="workspace-actions">
      <el-button type="warning" plain :disabled="busy || !hasItems" @click="$emit('reset')">
        {{ $t('reset') }} ({{ shortcut }} + A)
      </el-button>
      <el-button v-if="pendingCount || !uploadedCount" type="primary" :disabled="!canUpload" :loading="busy" @click="$emit('upload')">
        {{ $t('upload') }} ({{ shortcut }} + S)
      </el-button>
      <el-button v-if="uploadedCount" type="primary" :disabled="busy" @click="$emit('copyAll')">
        <PicxIcon name="copy" :size="18" />{{ $t('upload_workspace.copy_all') }}
      </el-button>
    </div>
    <div v-if="uploadedCount > 0" class="copy-format">
      <label :for="formatId">{{ $t('upload_workspace.link_format') }}</label>
      <el-select :id="formatId" :model-value="selectedFormat" :disabled="busy" @update:model-value="$emit('format', $event)">
        <el-option value="raw" :label="$t('upload_workspace.raw_url')" />
        <el-option v-for="format in settings.imageLinkFormat.presetList" :key="format.name" :value="format.name" :label="format.name" />
      </el-select>
    </div>
    <ImageLinkPreview v-if="uploadedCount > 0" :settings="settings" template-only />
    <p v-if="processing" class="processing-note" role="status">
      {{ $t('upload_workspace.processing') }}
    </p>

    <SettingsSyncFeedback />
    <div v-if="uploadedCount > 0" class="workspace-deployment">
      <slot name="deployment" />
    </div>
  </aside>
</template>

<style scoped lang="stylus">
.upload-settings-panel {
  box-sizing border-box
  min-width 0
  padding 24px
  color var(--picx-color-text)
  background var(--picx-color-surface)
  border-radius var(--picx-radius-card)
  font-size 14px

  h2 {
    margin 0 0 12px
    font-size 20px
    line-height 1.5
  }

  .preference-switch {
    display flex
    align-items center
    justify-content space-between
    gap 12px
    min-height 44px
  }

  .copy-format {
    display grid
    gap 8px
    margin 12px 0

    .el-select {
      width 100%
      --el-border-radius-base 10px
    }
  }

  :deep(.image-link-preview) {
    padding 10px
    background var(--picx-color-bg)
    border-radius 10px
    font-size 12px
    line-height 1.5

    pre {
      margin-top 4px
    }
  }

  .preference-switch :deep(.el-switch__core) {
    min-width 40px
    height 24px

    .el-switch__action {
      width 18px
      height 18px
    }
  }

  .preference-switch :deep(.el-switch.is-checked .el-switch__action) {
    left calc(100% - 19px)
  }

  .processing-note {
    color var(--picx-color-text-muted)
    line-height 1.6
  }

  .workspace-actions .el-button--warning.is-plain {
    --el-button-bg-color var(--picx-color-warning-soft)
    --el-button-border-color var(--picx-color-warning)
  }

  .workspace-actions {
    display grid
    gap 10px
    margin-top 12px

    .el-button {
      gap 8px
      height auto
      min-height 44px
      margin-left 0
      border-radius 10px

      :deep(> span) {
        flex-wrap wrap
        justify-content center
        gap 8px
        white-space normal
      }
    }
  }

  .workspace-deployment {
    margin-top 24px
  }

  @media (max-width 767px) {
    padding 20px 16px
  }
}
</style>
