<script setup lang="ts">
import { computed } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { directoryBreadcrumbs } from '@/utils/management-utils'

const props = defineProps<{ path: string, loading: boolean, busy: boolean }>()
const emit = defineEmits<{ browse: [path: string], upload: [path: string], reload: [] }>()
const breadcrumbs = computed(() => directoryBreadcrumbs(props.path))
const parent = computed(() => breadcrumbs.value.at(-2)?.path ?? '/')
</script>

<template>
  <div class="tools-bar">
    <button class="directory-back" type="button" :disabled="busy || path === '/'" :aria-label="$t('management_page.workspace.back')" @click="emit('browse', parent)">
      <PicxIcon name="arrow-left" />
    </button>
    <nav class="directory-breadcrumbs" :aria-label="$t('management_page.workspace.navigation')" tabindex="0">
      <PicxIcon name="folder-open" />
      <ol>
        <li v-for="(item, index) in breadcrumbs" :key="item.path">
          <PicxIcon v-if="index" name="chevron-right" :size="16" />
          <button type="button" :disabled="busy" :aria-current="item.path === path ? 'page' : undefined" :aria-label="item.path === '/' ? $t('management_page.workspace.root') : undefined" @click="emit('browse', item.path)">
            {{ item.name }}
          </button>
        </li>
      </ol>
    </nav>
    <div class="directory-tools">
      <slot />
      <button type="button" :disabled="loading || busy" :aria-label="$t('management_page.reload')" @click="emit('reload')">
        <PicxIcon name="refresh-cw" :class="{ 'is-loading': loading }" />
      </button>
      <el-button :disabled="busy" class="directory-upload" @click="emit('upload', path)">
        <PicxIcon name="upload" :size="18" />
        {{ path === '/' ? $t('management_page.workspace.uploadRoot') : $t('management_page.workspace.uploadCurrent') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import './tools-bar.styl'
</style>
