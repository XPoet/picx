<script setup lang="ts">
import type { UploadBatchResult, UploadTargetSnapshot } from '@/common/model/upload'
import { computed } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { displayDirectory } from '@/utils/directory-utils'

const props = defineProps<{ batch: UploadBatchResult }>()
defineEmits<{ manage: [target: UploadTargetSnapshot], reconnect: [] }>()
const kind = computed(() => props.batch.failures.length ? props.batch.successes.length ? 'partial' : 'failed' : 'complete')
const permission = computed(() => props.batch.failures.find(result => ['unauthenticated', 'forbidden'].includes(result.error.kind)))
const target = computed(() => props.batch.successes[0]?.target)
</script>

<template>
  <section class="upload-result-summary" :class="kind" :aria-label="$t('upload_workspace.result')" aria-live="polite">
    <PicxIcon :name="kind === 'complete' ? 'circle-check' : 'triangle-alert'" :size="24" />
    <div class="result-text">
      <h2>{{ $t(`upload_workspace.batch_${kind}`) }}</h2>
      <p>{{ $t('upload_workspace.batch_counts', { success: batch.successes.length, failed: batch.failures.length }) }}</p>
      <p v-if="target" class="result-path">
        {{ $t('upload_workspace.actual_target') }} <strong>{{ displayDirectory(target.dir) }}</strong>
      </p>
      <p v-if="permission">
        {{ $t(`request_error.${permission.error.kind}`) }}
      </p>
      <p v-if="batch.cacheFailed">
        {{ $t('upload_workspace.cache_failed') }}
      </p>
    </div>
    <div class="result-actions">
      <el-button v-if="target" @click="$emit('manage', target)">
        <PicxIcon name="arrow-up-right" :size="18" />{{ $t('upload_workspace.view_management') }}
      </el-button>
      <el-button v-if="permission" @click="$emit('reconnect')">
        {{ $t('repository_context.reconnect') }}
      </el-button>
    </div>
  </section>
</template>

<style scoped lang="stylus">
.upload-result-summary {
  display flex
  flex-wrap wrap
  align-items flex-start
  gap 12px
  box-sizing border-box
  min-width 0
  margin-bottom 16px
  padding 20px
  color var(--picx-color-success)
  background var(--picx-color-success-soft)
  border-radius var(--picx-radius-control)

  &.partial {
    color var(--picx-color-warning)
    background var(--picx-color-warning-soft)
  }

  &.failed {
    color var(--picx-color-danger)
    background var(--picx-color-danger-soft)
  }

  .result-text {
    flex 1
    min-width 160px

    h2 {
      margin 0
      font-size 18px
      line-height 1.5
    }

    p {
      margin 4px 0 0
      font-size 14px
      line-height 1.6
    }
  }

  .result-path {
    overflow-wrap anywhere
  }

  .result-actions {
    display flex
    flex-wrap wrap
    gap 8px

    .el-button {
      height auto
      min-height 44px
      margin-left 0

      :deep(> span) {
        gap 8px
        white-space normal
      }
    }
  }
}
</style>
