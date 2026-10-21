<script lang="ts" setup>
import type { UploadedImageModel } from '@/common/model'
import type { ManagementDirectoryAction, ManagementMediaAction } from '@/common/model/management'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ContextmenuEnum } from '@/common/directive/types'
import { ImageSortEnum } from '@/common/model'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useImageUploadTime } from '@/composables/use-image-upload-time'
import { useManagementDirectory } from '@/composables/use-management-directory'
import { useManagementSelection } from '@/composables/use-management-selection'
import { copyManagementLinks, deleteMediaWithConfirmation, editDirectory, isManagementMediaLoading, managementBusy, managementDeleteResult, managementOperation, managementPropertiesImage, openManagementRepository, openMediaMove, renameMedia, showMediaProperties } from '@/services/management-actions'
import { store } from '@/stores'
import { filterManagementContent, sortDirList, sortImageList } from '@/utils/management-utils'
import FolderCard from './components/folder-card/folder-card.vue'
import ImageCard from './components/image-card/image-card.vue'
import ImageSelector from './components/image-selector/image-selector.vue'
import MediaPropertiesDialog from './components/media-properties-dialog/media-properties-dialog.vue'
import MoveImageDialog from './components/move-image-dialog/move-image-dialog.vue'
import ToolsBar from './components/tools-bar/tools-bar.vue'

const { path, directories, images, loading, failed, error, browse, upload, reload } = useManagementDirectory()
const sortMode = computed(() => store.getters.getUserSettings.management.sort)
const query = ref('')
const visible = computed(() => filterManagementContent(directories.value, images.value, query.value))
const sortedDirList = computed(() => sortDirList(visible.value.directories, sortMode.value))
const sortedImageList = computed(() => sortImageList(visible.value.images, sortMode.value))
watch(path, () => {
  query.value = ''
})
const selection = useManagementSelection(sortedImageList, path, query)
managementDeleteResult.value = null
const failedVisibleImages = computed(() => sortedImageList.value.filter(image => managementDeleteResult.value?.failures.some(item => item.path === image.path && item.sha === image.sha)))
watch(images, (items) => {
  const result = managementDeleteResult.value
  if (result?.failures.length && result.failures.every(failure => !items.some(image => image.path === failure.path && image.sha === failure.sha)))
    managementDeleteResult.value = null
})
watch([path, query], () => {
  managementDeleteResult.value = null
})
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
watch([images, sortMode], ([items, mode]) => {
  cancelBackfill()
  if (mode === ImageSortEnum.timeDesc)
    backfillUploadTime(items)
}, { immediate: true })
async function batchCopy() {
  await copyManagementLinks(selection.selectedImages.value, true)
}
async function batchDelete() {
  await deleteMediaWithConfirmation([...selection.selectedImages.value])
}
function directoryAction(target: string, action: ManagementDirectoryAction) {
  if (managementBusy.value)
    return
  if (action === 'open')
    browse(target)
  else if (action === 'upload')
    void upload(target)
  else if (action === 'repository')
    openManagementRepository(target)
  else void editDirectory(target, action)
}
function setAvailability(image: UploadedImageModel, available: boolean) {
  image.deployed = available
}
async function mediaAction(image: UploadedImageModel, action: ManagementMediaAction) {
  if (managementBusy.value)
    return
  if (action === 'copy')
    await copyManagementLinks([image])
  else if (action === 'property')
    await showMediaProperties(image)
  else if (action === 'rename')
    await renameMedia(image)
  else if (action === 'move')
    openMediaMove(image)
  else if (action === 'delete')
    await deleteMediaWithConfirmation([image])
  else if (action === 'repository')
    openManagementRepository(image.dir)
}
onBeforeUnmount(() => {
  cancelBackfill()
  managementDeleteResult.value = null
  managementPropertiesImage.value = null
})
</script>

<template>
  <div class="page-container management-page-container">
    <ToolsBar :path="path" :loading="loading" :busy="managementBusy" @browse="browse" @reload="reload">
      <label class="management-search">
        <PicxIcon name="search" :size="18" />
        <input v-model="query" :disabled="managementBusy" type="search" :placeholder="$t('management_page.workspace.search')">
      </label>
    </ToolsBar>
    <div class="management-summary">
      <ImageSelector v-if="selection.selectedImages.value.length" :total="sortedImageList.length" :selected="selection.selectedImages.value.length" :all-selected="selection.allSelected.value" :indeterminate="selection.indeterminate.value" :filtered="Boolean(query.trim())" :busy="managementBusy" :copying="managementOperation?.kind === 'copy'" :deleting="managementOperation?.kind === 'delete'" @select-all="selection.selectAll" @clear="selection.clear" @copy="batchCopy" @delete="batchDelete" />
      <h1 v-else>
        {{ $t('management_page.workspace.contents') }}
      </h1>
      <span class="grid-indicator" role="img"><PicxIcon name="layout-grid" /></span>
      <el-select :disabled="managementBusy" :model-value="sortMode" @update:model-value="setSort">
        <el-option v-for="option in sortOptions" :key="option.value" :value="option.value" :label="$t(option.labelKey)" />
      </el-select>
    </div>
    <div v-if="failed" class="management-error" role="alert">
      <PicxIcon name="triangle-alert" />
      <span>{{ $t('management_page.workspace.loadFailed') }} {{ error ? $t(`request_error.${error.kind}`) : '' }}</span>
      <el-button :loading="loading" :disabled="managementBusy" @click="reload">
        {{ $t('management_page.workspace.retry') }}
      </el-button>
    </div>
    <div v-if="managementDeleteResult?.failures.length" class="management-error" role="alert">
      <PicxIcon name="triangle-alert" />
      <span>{{ $t('management_page.workspace.deletePartial', { succeeded: managementDeleteResult.successes.length, failed: managementDeleteResult.failures.length }) }}</span>
      <el-button :loading="managementOperation?.kind === 'delete'" :disabled="managementBusy || !failedVisibleImages.length" @click="deleteMediaWithConfirmation(failedVisibleImages)">
        {{ $t('management_page.workspace.retryDelete') }}
      </el-button>
    </div>
    <div v-loading="loading || managementOperation?.kind === 'upload'" v-contextmenu="{ type: ContextmenuEnum.dirArea }" class="management-content" :element-loading-text="managementOperation ? $t(`management_page.workspace.${managementOperation.kind}Loading`) : $t('management_page.loadingTxt1')">
      <section v-if="sortedDirList.length">
        <h2>{{ $t('management_page.workspace.folders') }} <span>{{ sortedDirList.length }}</span></h2>
        <ul class="dir-card-list">
          <li v-for="dir in sortedDirList" :key="dir.dirPath">
            <FolderCard :folder-obj="dir" :busy="managementBusy" :loading="managementOperation?.directory === dir.dirPath" :loading-text="managementOperation ? $t(`management_page.workspace.${managementOperation.kind}Loading`) : undefined" @open="browse" @action="directoryAction(dir.dirPath, $event)" />
          </li>
        </ul>
      </section>
      <section v-if="sortedImageList.length">
        <div class="media-section-heading">
          <h2>{{ $t('management_page.workspace.media') }} <span>{{ sortedImageList.length }}</span></h2>
          <ImageSelector v-if="!selection.selectedImages.value.length" :total="sortedImageList.length" :selected="0" :all-selected="false" :indeterminate="false" :filtered="Boolean(query.trim())" :busy="managementBusy" :copying="managementOperation?.kind === 'copy'" :deleting="managementOperation?.kind === 'delete'" @select-all="selection.selectAll" />
        </div>
        <ul class="image-card-list">
          <li v-for="image in sortedImageList" :key="image.uuid">
            <ImageCard :image-obj="image" :loading="isManagementMediaLoading(image)" :loading-text="managementOperation ? $t(`management_page.workspace.${managementOperation.kind}Loading`) : undefined" :copying="managementOperation?.kind === 'copy' && isManagementMediaLoading(image)" :selected="selection.isSelected(image)" :busy="managementBusy" @select="selection.select(image, $event)" @availability="setAvailability(image, $event)" @action="mediaAction(image, $event)" />
          </li>
        </ul>
      </section>
      <div v-if="!loading && !failed && !sortedImageList.length" class="management-empty">
        <PicxIcon name="images" :size="48" />
        <template v-if="query.trim() && !sortedDirList.length">
          <h2>{{ $t('management_page.workspace.noResults') }}</h2>
          <p>{{ $t('management_page.workspace.searchScope') }}</p>
          <el-button @click="query = ''">
            {{ $t('management_page.workspace.clearSearch') }}
          </el-button>
        </template>
        <template v-else>
          <h2>{{ $t(`management_page.workspace.${sortedDirList.length ? 'noMedia' : 'emptyDirectory'}`) }}</h2>
          <p>{{ $t(`management_page.workspace.${sortedDirList.length ? 'folderHelp' : 'emptyHelp'}`) }}</p>
          <el-button type="primary" :loading="managementOperation?.kind === 'upload'" :disabled="managementBusy" @click="upload()">
            <PicxIcon name="upload" :size="18" />
            {{ path === '/' ? $t('management_page.workspace.uploadRoot') : $t('management_page.workspace.uploadCurrent') }}
          </el-button>
        </template>
      </div>
    </div>
    <MediaPropertiesDialog v-model:image="managementPropertiesImage" />
    <MoveImageDialog />
  </div>
</template>

<style scoped lang="stylus">
@import './imgs-management.styl'
</style>
