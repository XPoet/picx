<script setup lang="ts">
import type { ManagementDirectoryAction } from '@/common/model/management'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { ContextmenuEnum } from '@/common/directive/types'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'

defineProps<{ folderObj: DirObject, busy: boolean }>()
const emit = defineEmits<{ open: [path: string], action: [action: ManagementDirectoryAction] }>()
</script>

<template>
  <div v-contextmenu="{ type: ContextmenuEnum.dir, dir: folderObj.dir }" class="folder-card" :class="{ active: folderObj.active }">
    <button type="button" :disabled="busy" :aria-label="$t('management_page.workspace.openFolder', { name: folderObj.dir })" :title="folderObj.dir" @click="emit('open', folderObj.dirPath)">
      <PicxIcon name="folder" :size="44" />
      <span class="folder-name">{{ folderObj.dir }}</span>
      <span class="folder-kind">{{ $t('management_page.workspace.folder') }}</span>
    </button>
    <el-dropdown class="folder-menu" trigger="click" @command="emit('action', $event)">
      <button type="button" :disabled="busy" :aria-label="$t('management_page.workspace.moreDirectory', { name: folderObj.dir })">
        <PicxIcon name="ellipsis" />
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="upload">
            {{ $t('management_page.workspace.uploadCurrent') }}
          </el-dropdown-item>
          <el-dropdown-item command="repository">
            {{ $t('management_page.workspace.repository') }}
          </el-dropdown-item>
          <el-dropdown-item command="rename">
            {{ $t('management_page.workspace.rename') }}
          </el-dropdown-item>
          <el-dropdown-item command="delete">
            {{ $t('management_page.workspace.deleteDirectory') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="stylus">
@import './folder-card.styl'
</style>
