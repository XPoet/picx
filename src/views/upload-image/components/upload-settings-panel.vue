<script setup lang="ts">
import type { UserSettingsModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import { computed, useId } from 'vue'
import ImageLinkPreview from '@/components/image-link-preview/image-link-preview.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import SettingsSyncFeedback from '@/components/settings-sync-feedback.vue'
import { formatFileBytes } from '@/utils/file-utils'

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
function formatChange(event: Event) {
  return event.target instanceof HTMLSelectElement ? event.target.value : 'raw'
}
</script>

<template>
  <aside class="upload-settings-panel" :aria-label="$t('upload_workspace.settings')">
    <h2>{{ $t('upload_workspace.settings') }}</h2>
    <div class="preference-switch">
      <span :id="`${formatId}-compress`">{{ $t('upload_workspace.auto_compress') }}</span>
      <el-switch :model-value="settings.compress.enable" :disabled="busy" :aria-label="$t('upload_workspace.auto_compress')" @update:model-value="$emit('compress', $event === true)" />
    </div>
    <div class="preference-switch">
      <span :id="`${formatId}-watermark`">{{ $t('upload_workspace.add_watermark') }}</span>
      <el-switch :model-value="settings.watermark.enable" :disabled="busy" :aria-label="$t('upload_workspace.add_watermark')" @update:model-value="$emit('watermark', $event === true)" />
    </div>
    <div class="copy-format">
      <label :for="formatId">{{ $t('upload_workspace.link_format') }}</label>
      <select :id="formatId" :value="selectedFormat" :disabled="busy" @change="$emit('format', formatChange($event))">
        <option value="raw">
          {{ $t('upload_workspace.raw_url') }}
        </option>
        <option v-for="format in settings.imageLinkFormat.presetList" :key="format.name" :value="format.name">
          {{ format.name }}
        </option>
      </select>
    </div>
    <ImageLinkPreview v-if="target" :target="target" :directory="directory" :settings="settings" />
    <div class="upload-totals" aria-live="polite">
      <span>{{ $t('upload_workspace.pending', { count: pendingCount }) }}</span>
      <strong>{{ formatFileBytes(pendingBytes) }}</strong>
    </div>
    <p v-if="processing" class="processing-note" role="status">
      {{ $t('upload_workspace.processing') }}
    </p>
    <div class="workspace-actions">
      <el-button type="warning" plain :disabled="busy || !hasItems" @click="$emit('reset')">
        <PicxIcon name="rotate-ccw" :size="18" />{{ $t('reset') }}<kbd>{{ shortcut }} A</kbd>
      </el-button>
      <el-button v-if="pendingCount || !uploadedCount" type="primary" :disabled="!canUpload" :loading="busy" @click="$emit('upload')">
        <PicxIcon name="upload" :size="18" />{{ $t('upload_workspace.upload_count', { count: pendingCount }) }}<kbd>{{ shortcut }} S</kbd>
      </el-button>
      <el-button v-if="uploadedCount" type="primary" :disabled="busy" @click="$emit('copyAll')">
        <PicxIcon name="copy" :size="18" />{{ $t('upload_workspace.copy_all') }}
      </el-button>
    </div>
    <SettingsSyncFeedback />
    <div class="workspace-deployment">
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
    margin 0 0 16px
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

  :deep(.upload-directory-summary) {
    display grid
    grid-template-columns minmax(0, 1fr) minmax(0, 1fr)
    gap 4px 8px
    margin 12px 0 20px

    strong {
      text-align right
    }

    button {
      grid-column 1 / -1
      margin-top 8px
      border 1px solid var(--picx-color-control-border)
      border-radius var(--picx-radius-control)
    }
  }

  .copy-format {
    display grid
    gap 8px
    margin-bottom 12px

    select {
      box-sizing border-box
      width 100%
      min-height 44px
      padding 8px 12px
      color var(--picx-color-text)
      background var(--picx-color-surface)
      border 1px solid var(--picx-color-control-border)
      border-radius var(--picx-radius-control)
      font inherit
    }
  }

  .upload-totals {
    display flex
    flex-wrap wrap
    justify-content space-between
    gap 8px
    margin-top 20px
    padding-top 16px
    border-top 1px solid var(--picx-color-border)
  }

  .processing-note {
    color var(--picx-color-text-muted)
    line-height 1.6
  }

  .workspace-actions {
    display grid
    gap 10px
    margin-top 16px

    .el-button {
      gap 8px
      height auto
      min-height 44px
      margin-left 0

      :deep(> span) {
        flex-wrap wrap
        justify-content center
        gap 8px
        white-space normal
      }
    }
  }

  kbd {
    margin-left 4px
    color inherit
    font-family inherit
    font-size 12px
  }

  .workspace-deployment {
    margin-top 20px

    :deep(.deploy-item) {
      flex-wrap wrap
      height auto
      min-height 44px
      padding 8px
      font-size 14px

      .left-wrap {
        flex-wrap wrap
        gap 4px
      }

      .right-wrap {
        width 100%

        .el-button {
          width 100%
        }
      }
    }
  }

  @media (max-width 767px) {
    padding 20px 16px

    .copy-format select {
      font-size 16px
    }
  }
}
</style>
