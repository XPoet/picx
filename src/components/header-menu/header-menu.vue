<script setup lang="ts">
import type { PicxIconName } from '@/components/picx-icon/types'
import { nextTick, onMounted, onUnmounted, ref, useId, useTemplateRef } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'

withDefaults(defineProps<{
  label: string
  icon?: PicxIconName
  wide?: boolean
}>(), { wide: false })

const open = ref(false)
const panelId = useId()
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const panel = useTemplateRef<HTMLElement>('panel')

const close = (restoreFocus = false) => {
  open.value = false
  if (restoreFocus) {
    trigger.value?.focus()
  }
}

const show = async () => {
  open.value = true
  await nextTick()
  panel.value?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
}

const toggle = () => open.value ? close(true) : show()

const onMenuKey = (event: KeyboardEvent) => {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    return
  }
  const items = Array.from(panel.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? [])
  const current = items.findIndex(item => item === document.activeElement)
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length
  items[index]?.focus()
  event.preventDefault()
}

const onOutsidePointer = (event: PointerEvent) => {
  if (event.target instanceof Node && !root.value?.contains(event.target)) {
    close()
  }
}

const onFocusOut = (event: FocusEvent) => {
  if (event.relatedTarget instanceof Node && !root.value?.contains(event.relatedTarget)) {
    close()
  }
}

onMounted(() => document.addEventListener('pointerdown', onOutsidePointer))
onUnmounted(() => document.removeEventListener('pointerdown', onOutsidePointer))
</script>

<template>
  <div ref="root" class="header-menu" :class="{ wide }" @keydown.esc.stop.prevent="close(true)" @focusout="onFocusOut">
    <button
      ref="trigger"
      class="picx-icon-button menu-trigger"
      type="button"
      :aria-label="label"
      :aria-expanded="open"
      :aria-controls="panelId"
      aria-haspopup="menu"
      @click="toggle"
      @keydown.down.prevent="show"
    >
      <slot name="trigger">
        <PicxIcon v-if="icon" :name="icon" />
      </slot>
    </button>
    <div v-if="open" :id="panelId" ref="panel" class="header-menu-panel" role="menu" :aria-label="label" @keydown="onMenuKey">
      <slot :close="() => close(true)" />
    </div>
  </div>
</template>

<style scoped lang="stylus">
.header-menu {
  position relative

  &.wide .menu-trigger {
    gap var(--picx-space-2)
    width auto
    padding 0 12px
    border-radius var(--picx-radius-control)
  }

  .header-menu-panel {
    position absolute
    top calc(100% + 8px)
    right 0
    z-index var(--picx-layer-menu)
    box-sizing border-box
    width 240px
    max-width calc(100vw - 64px)
    max-height unquote('min(400px, calc(100dvh - 160px))')
    padding var(--picx-space-2)
    overflow-y auto
    color var(--picx-color-text)
    font-size var(--picx-font-body)
    background var(--picx-color-surface)
    border 1px solid var(--picx-color-border)
    border-radius var(--picx-radius-control)
    box-shadow 0 8px 24px var(--picx-color-shadow)

    :deep([role^="menuitem"]) {
      display flex
      align-items center
      gap var(--picx-space-3)
      box-sizing border-box
      min-height var(--picx-control-height)
      width 100%
      padding 8px 12px
      color var(--picx-color-text)
      font-size var(--picx-font-body)
      line-height 1.5
      text-align start
      background transparent
      border 0
      border-radius 8px
      cursor pointer

      &:hover
      &[aria-checked="true"] {
        color var(--picx-color-primary)
        background var(--picx-color-primary-soft)
      }

      &:disabled {
        color var(--picx-color-text-muted)
        cursor wait
      }
    }
  }
}
</style>
