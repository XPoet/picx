<script setup lang="ts">
import { retrySettingsSync, settingsSyncState } from '@/stores/settings-sync-state'
</script>

<template>
  <div v-if="settingsSyncState.phase === 'failed'" class="settings-sync-feedback" role="status">
    <span>{{ $t(`settings_sync.failed_${settingsSyncState.scope}`) }}</span>
    <span v-if="settingsSyncState.error">{{ $t(settingsSyncState.error.kind === 'invalid-response' ? 'settings_sync.corrupt' : `request_error.${settingsSyncState.error.kind}`) }}</span>
    <el-button v-if="settingsSyncState.retryable" @click="retrySettingsSync">
      {{ $t('settings_sync.retry') }}
    </el-button>
  </div>
</template>

<style scoped lang="stylus">
.settings-sync-feedback {
  display flex
  flex-wrap wrap
  align-items center
  justify-content space-between
  gap 8px
  color var(--picx-color-text-muted)
  font-size 14px
  line-height 1.6

  .el-button {
    min-height 44px
    height auto
    margin-left 0
  }
}
</style>
