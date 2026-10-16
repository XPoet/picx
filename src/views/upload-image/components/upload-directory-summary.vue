<script setup lang="ts">
withDefaults(defineProps<{ path: string, disabled?: boolean }>(), { disabled: false })
defineEmits<{ change: [] }>()
</script>

<template>
  <div class="upload-directory-summary">
    <span>{{ $t('upload_directory.current') }}</span>
    <strong :title="path" data-testid="saved-upload-directory">{{ path }}</strong>
    <button type="button" :disabled="disabled" @click="$emit('change')">
      {{ $t('upload_directory.change') }}
    </button>
  </div>
</template>

<style scoped lang="stylus">
.upload-directory-summary {
  display flex
  flex 1
  flex-wrap wrap
  align-items center
  gap 8px 12px
  min-width 0
  font-size 14px

  span {
    color var(--picx-color-text-muted)
  }

  strong {
    min-width 0
    overflow-wrap anywhere
    font-weight 500
  }

  button {
    min-height 44px
    padding 0 8px
    color var(--picx-color-primary)
    font-size inherit
    background transparent
    border 0
    cursor pointer

    &:disabled {
      cursor not-allowed
    }
  }
}
</style>
