<script lang="ts" setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { ImageSortEnum } from '@/common/model'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useImageUploadTime } from '@/composables/use-image-upload-time'
import { useManagementDirectory } from '@/composables/use-management-directory'
import { store } from '@/stores'
import FolderCard from './components/folder-card/folder-card.vue'
import ImageCard from './components/image-card/image-card.vue'
import ImageSelector from './components/image-selector/image-selector.vue'
import MoveImageDialog from './components/move-image-dialog/move-image-dialog.vue'
import ToolsBar from './components/tools-bar/tools-bar.vue'
import { sortDirList, sortImageList } from './imgs-management.util'

const { path, directories, images, loading, failed, browse, upload, reload } = useManagementDirectory()
const sortMode = computed(() => store.getters.getUserSettings.management.sort)
const sortedDirList = computed(() => sortDirList(directories.value, sortMode.value))
const sortedImageList = computed(() => sortImageList(images.value, sortMode.value))
const sortOptions = [
  { value: ImageSortEnum.default, labelKey: 'management_page.sortDefault' },
  { value: ImageSortEnum.nameAsc, labelKey: 'management_page.sortNameAsc' },
  { value: ImageSortEnum.nameDesc, labelKey: 'management_page.sortNameDesc' },
  { value: ImageSortEnum.timeDesc, labelKey: 'management_page.sortTimeDesc' },
]
function setSort(value: ImageSortEnum) {
  void store.dispatch('SET_USER_SETTINGS', { management: { sort: value } })
}
const { backfillUploadTime, cancelBackfill } = useImageUploadTime()
watch(images, value => store.commit('REPLACE_IMAGE_CARD', { checkedImgArr: value }), { immediate: true })
watch([images, sortMode], ([items, mode]) => {
  cancelBackfill()
  if (mode === ImageSortEnum.timeDesc)
    backfillUploadTime(items)
}, { immediate: true })
onBeforeUnmount(cancelBackfill)
</script>

<template>
  <div class="page-container management-page-container">
    <ToolsBar :path="path" :loading="loading" @browse="browse" @upload="upload" @reload="reload" />
    <div class="management-summary">
      <span>{{ $t('nav.management') }}</span>
      <el-select :model-value="sortMode" :aria-label="$t('management_page.sort')" @update:model-value="setSort">
        <el-option v-for="option in sortOptions" :key="option.value" :value="option.value" :label="$t(option.labelKey)" />
      </el-select>
    </div>
    <div v-if="failed" class="management-error" role="alert">
      <PicxIcon name="triangle-alert" />
      <span>{{ $t('management_page.workspace.loadFailed') }}</span>
      <el-button @click="reload">
        {{ $t('management_page.workspace.retry') }}
      </el-button>
    </div>
    <div v-loading="loading" class="management-content" :aria-busy="loading" :element-loading-text="$t('management_page.loadingTxt1')">
      <ImageSelector v-if="images.length" :key="path" :current-dir-image-list="images" />
      <ul v-if="sortedDirList.length" class="dir-card-list">
        <li v-for="dir in sortedDirList" :key="dir.dirPath">
          <FolderCard :folder-obj="dir" @open="browse" />
        </li>
      </ul>
      <ul v-if="sortedImageList.length" class="image-card-list">
        <li v-for="image in sortedImageList" :key="image.uuid">
          <ImageCard :image-obj="image" />
        </li>
      </ul>
      <el-empty v-if="!loading && !failed && !images.length && !directories.length">
        <el-button type="primary" @click="upload()">
          {{ path === '/' ? $t('management_page.workspace.uploadRoot') : $t('management_page.workspace.uploadCurrent') }}
        </el-button>
      </el-empty>
    </div>
    <MoveImageDialog />
  </div>
</template>

<style scoped lang="stylus">
@import './imgs-management.styl'
</style>
