<script setup lang="ts">
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { ContextmenuEnum } from '@/common/directive/types'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'

defineProps<{ folderObj: DirObject }>()
const emit = defineEmits<{ open: [path: string] }>()
</script>

<template>
  <div v-contextmenu="{ type: ContextmenuEnum.dir, dir: folderObj.dir }" class="folder-card" :class="{ active: folderObj.active }">
    <button type="button" :aria-label="$t('management_page.workspace.openFolder', { name: folderObj.dir })" :title="folderObj.dir" @click="emit('open', folderObj.dirPath)">
      <PicxIcon name="folder" :size="44" />
      <span class="folder-name">{{ folderObj.dir }}</span>
      <span class="folder-kind">{{ $t('management_page.workspace.folder') }}</span>
    </button>
  </div>
</template>

<style scoped lang="stylus">
@import './folder-card.styl'
</style>
