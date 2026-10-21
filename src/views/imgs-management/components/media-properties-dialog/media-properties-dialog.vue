<template>
  <el-dialog :model-value="image !== null" :title="$t('management_page.workspace.property')" class="media-properties-dialog" width="min(520px, calc(100vw - 32px))" align-center append-to-body destroy-on-close @update:model-value="close">
    <el-descriptions v-if="image" :column="1" border label-width="88" table-layout="fixed">
      <el-descriptions-item :label="$t('management_page.workspace.fileName')">
        {{ image.name }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('management_page.workspace.fileDirectory')">
        {{ image.dir === '/' ? '/' : `/${image.dir}` }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('management_page.workspace.fileType')">
        {{ $t(`management_page.workspace.${image.type === 'video' ? 'video' : 'image'}`) }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('management_page.workspace.fileSize')">
        {{ size ?? $t('management_page.workspace.unknownSize') }}
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button type="primary" @click="close">
        {{ $t('confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/* eslint vue/block-order: ["error", { "order": ["template", "script", "style"] }] */
import type { MediaPropertiesDialogEmits, MediaPropertiesDialogProps } from './media-properties-dialog.model'
import { computed } from 'vue'

const props = defineProps<MediaPropertiesDialogProps>()
const emit = defineEmits<MediaPropertiesDialogEmits>()
const size = computed(() => props.image && Number.isFinite(props.image.size) && props.image.size > 0
  ? `${Number((props.image.size / 1024).toFixed(2))} KB`
  : null)
function close() {
  emit('update:image', null)
}
</script>

<style lang="stylus">
@import './media-properties-dialog.styl'
</style>
