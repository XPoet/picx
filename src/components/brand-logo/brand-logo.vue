<script setup lang="ts">
import horizontal from '@/assets/brand/picx-horizontal.svg?no-inline'
import symbol from '@/assets/brand/picx-symbol.svg?no-inline'

withDefaults(defineProps<{
  variant?: 'horizontal' | 'symbol'
}>(), { variant: 'horizontal' })
</script>

<template>
  <svg
    class="brand-logo"
    :viewBox="variant === 'symbol' ? '0 0 64 64' : '0 0 128 48'"
    aria-hidden="true"
    focusable="false"
  >
    <use :href="variant === 'symbol' ? `${symbol}#picx-symbol` : `${horizontal}#picx-horizontal`" />
  </svg>
</template>

<style scoped lang="stylus">
.brand-logo {
  display block
  flex-shrink 0
  width 128px
  height 48px
  color var(--picx-color-text)
}
</style>
