<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { clearCopyFailure, copyFailureText } from '@/composables/use-copy-feedback'
import { copyText } from '@/utils/common-utils'

const textArea = useTemplateRef<HTMLTextAreaElement>('textArea')
const visible = computed(() => copyFailureText.value !== null)
const retrying = ref(false)
async function retry() {
  if (copyFailureText.value === null || retrying.value)
    return
  retrying.value = true
  try {
    await copyText(copyFailureText.value)
  }
  finally {
    retrying.value = false
  }
}
function select() {
  textArea.value?.focus()
  textArea.value?.select()
}
</script>

<template>
  <el-dialog :model-value="visible" :title="$t('clipboard.title')" width="640px" class="copy-fallback-dialog" @update:model-value="!$event && clearCopyFailure()" @opened="select">
    <p role="status">
      {{ $t('clipboard.description') }}
    </p>
    <textarea ref="textArea" :value="copyFailureText ?? ''" :aria-label="$t('clipboard.text')" readonly rows="6" />
    <template #footer>
      <el-button @click="clearCopyFailure()">
        {{ $t('clipboard.close') }}
      </el-button>
      <el-button :disabled="retrying" @click="select">
        {{ $t('clipboard.select') }}
      </el-button>
      <el-button type="primary" :loading="retrying" @click="retry">
        <PicxIcon name="copy" :size="18" />{{ $t('clipboard.retry') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="stylus">
.copy-fallback-dialog {
  max-width calc(100vw - 32px)
  color var(--picx-color-text)

  p {
    font-size 14px
    line-height 1.6
  }

  textarea {
    box-sizing border-box
    width 100%
    padding 12px
    font-family inherit
    font-size 16px
    line-height 1.6
    color var(--picx-color-text)
    background var(--picx-color-surface-muted)
    border 1px solid var(--picx-color-control-border)
    border-radius var(--picx-radius-control)
    resize vertical
  }

  .el-dialog__footer {
    display flex
    flex-wrap wrap
    gap 8px
    justify-content flex-end

    .el-button {
      gap 8px
      margin-left 0
    }
  }
}
</style>
