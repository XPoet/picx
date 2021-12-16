<template>
  <div class="folder-card">
    <div class="folder"><img src="./icon/folder.svg" alt="" srcset="" /></div>

    <div class="name">
      {{ folderObj.name }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, defineEmits } from 'vue'

// eslint-disable-next-line no-undef
const props = defineProps({
  folderObj: {
    type: Object,
    default: {
      name: '上一级'
    }
  }
})

const emits = defineEmits(['update:modelValue'])
</script>

<style scoped lang="stylus">
@import 'folder-card.styl';
</style>
