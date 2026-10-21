<script setup lang="ts">
import PicxIcon from '@/components/picx-icon/picx-icon.vue'

defineProps<{ total: number, selected: number, allSelected: boolean, indeterminate: boolean, filtered: boolean, busy: boolean, copying?: boolean, deleting?: boolean }>()
const emit = defineEmits<{ selectAll: [checked: boolean], clear: [], copy: [], delete: [] }>()
function change(event: Event) {
  if (event.target instanceof HTMLInputElement)
    emit('selectAll', event.target.checked)
}
</script>

<template>
  <div class="selector-wrapper" :class="{ 'has-selection': selected > 0 }">
    <label class="select-all">
      <input type="checkbox" :checked="allSelected" :indeterminate.prop="indeterminate" :disabled="busy || !total" @change="change">
      <span>{{ $t(`management_page.workspace.${filtered ? 'selectResults' : 'selectVisible'}`, { total }) }}</span>
    </label>
    <span v-if="selected" role="status">{{ $t('management_page.workspace.selectedCount', { selected, total }) }}</span>
    <template v-if="selected">
      <button type="button" :disabled="busy" @click="emit('clear')">
        {{ $t('management_page.workspace.clearSelection') }}
      </button>
      <el-button :disabled="busy" :loading="copying" @click="emit('copy')">
        <PicxIcon name="copy" :size="18" />{{ $t('management_page.workspace.batchCopy') }}
      </el-button>
      <el-button class="batch-delete" :disabled="busy" :loading="deleting" @click="emit('delete')">
        <PicxIcon name="trash-2" :size="18" />{{ $t('management_page.workspace.batchDelete') }}
      </el-button>
    </template>
  </div>
</template>

<style scoped lang="stylus">
@import './image-selector.styl'
</style>
