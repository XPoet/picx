<script setup lang="ts">
import { computed } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { directoryBreadcrumbs } from '@/utils/management-utils'

const props = defineProps<{ path: string, loading: boolean, busy: boolean }>()
const emit = defineEmits<{ browse: [path: string], reload: [] }>()
const breadcrumbs = computed(() => directoryBreadcrumbs(props.path))
const parent = computed(() => breadcrumbs.value.at(-2)?.path ?? '/')
</script>

<template>
  <div class="tools-bar">
    <button class="directory-back" type="button" :disabled="busy || path === '/'" @click="emit('browse', parent)">
      <PicxIcon name="arrow-left" />
    </button>
    <nav class="directory-breadcrumbs" tabindex="0">
      <PicxIcon name="folder-open" />
      <ol>
        <li v-for="(item, index) in breadcrumbs" :key="item.path">
          <PicxIcon v-if="index" name="chevron-right" :size="16" />
          <button type="button" :disabled="busy" :class="{ 'is-current': item.path === path }" @click="emit('browse', item.path)">
            {{ item.name }}
          </button>
        </li>
      </ol>
    </nav>
    <div class="directory-tools">
      <slot />
      <el-button :title="$t('management_page.reload')" :loading="loading" :disabled="loading || busy" @click="emit('reload')">
        <PicxIcon v-if="!loading" name="refresh-cw" />
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import './tools-bar.styl'
</style>
