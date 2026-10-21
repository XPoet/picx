<script setup lang="ts">
import type { PicxIconName } from './types'
import sprite from '@/assets/icons/lucide.svg?no-inline'

withDefaults(defineProps<{
  name: PicxIconName
  size?: number
  label?: string
}>(), { size: 20 })
</script>

<template>
  <svg
    class="picx-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
    focusable="false"
  >
    <use :href="`${sprite}#${name}`" />
  </svg>
</template>

<style scoped lang="stylus">
.picx-icon {
  display inline-block
  flex-shrink 0
  vertical-align middle
}
</style>
