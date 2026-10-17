<script lang="ts" setup>
import type { UploadedImageModel } from '@/common/model'
import type { ManagementMediaAction } from '@/common/model/management'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ImageSortEnum } from '@/common/model'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useImageUploadTime } from '@/composables/use-image-upload-time'
import { useManagementDirectory } from '@/composables/use-management-directory'
import { store } from '@/stores'
import { copyImageLink, getGitHubRepoDirURL } from '@/utils'
import { filterManagementContent, sortDirList, sortImageList } from '@/utils/management-utils'
import FolderCard from './components/folder-card/folder-card.vue'
import { checkImgProperty, onDeleteImage, onMoveImage, onRenameImage } from './components/image-card/image-card.util'
import ImageCard from './components/image-card/image-card.vue'
import ImageSelector from './components/image-selector/image-selector.vue'
import MoveImageDialog from './components/move-image-dialog/move-image-dialog.vue'
import ToolsBar from './components/tools-bar/tools-bar.vue'

const { path, directories, images, loading, failed, browse, upload, reload } = useManagementDirectory()
const sortMode = computed(() => store.getters.getUserSettings.management.sort)
const query = ref('')
const visible = computed(() => filterManagementContent(directories.value, images.value, query.value))
const sortedDirList = computed(() => sortDirList(visible.value.directories, sortMode.value))
const sortedImageList = computed(() => sortImageList(visible.value.images, sortMode.value))
watch(path, () => {
  query.value = ''
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
watch(images, value => store.commit('REPLACE_IMAGE_CARD', { checkedImgArr: value }), { immediate: true })
watch([images, sortMode], ([items, mode]) => {
  cancelBackfill()
  if (mode === ImageSortEnum.timeDesc)
    backfillUploadTime(items)
}, { immediate: true })
function selectMedia(image: UploadedImageModel, selected: boolean) {
  image.checked = selected
}
function setAvailability(image: UploadedImageModel, available: boolean) {
  image.deployed = available
}
async function mediaAction(image: UploadedImageModel, action: ManagementMediaAction) {
  if (action === 'copy')
    await copyImageLink(image)
  else if (action === 'property')
    await checkImgProperty(image).catch(() => undefined)
  else if (action === 'rename')
    await onRenameImage(image).catch(() => undefined)
  else if (action === 'move')
    onMoveImage(image)
  else if (action === 'delete')
    onDeleteImage(image)
  else if (action === 'repository')
    window.open(getGitHubRepoDirURL(store.getters.getUserConfigInfo, image.dir === '/' ? '' : image.dir), '_blank', 'noopener,noreferrer')
}
onBeforeUnmount(cancelBackfill)
</script>

<template>
  <div class="page-container management-page-container">
    <ToolsBar :path="path" :loading="loading" @browse="browse" @upload="upload" @reload="reload">
      <label class="management-search">
        <PicxIcon name="search" :size="18" />
        <input v-model="query" type="search" :aria-label="$t('management_page.workspace.search')" :placeholder="$t('management_page.workspace.search')">
      </label>
    </ToolsBar>
    <div class="management-summary">
      <h1>{{ $t('management_page.workspace.contents') }}</h1>
      <span class="grid-indicator" :aria-label="$t('management_page.workspace.gridView')" role="img"><PicxIcon name="layout-grid" /></span>
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
      <ImageSelector v-if="images.length" :key="path" :current-dir-image-list="sortedImageList" />
      <section v-if="sortedDirList.length" :aria-label="$t('management_page.workspace.folders')">
        <h2>{{ $t('management_page.workspace.folders') }} <span>{{ sortedDirList.length }}</span></h2>
        <ul class="dir-card-list">
          <li v-for="dir in sortedDirList" :key="dir.dirPath">
            <FolderCard :folder-obj="dir" @open="browse" />
          </li>
        </ul>
      </section>
      <section v-if="sortedImageList.length" :aria-label="$t('management_page.workspace.media')">
        <h2>{{ $t('management_page.workspace.media') }} <span>{{ sortedImageList.length }}</span></h2>
        <ul class="image-card-list">
          <li v-for="image in sortedImageList" :key="image.uuid">
            <ImageCard :image-obj="image" :selected="image.checked" @select="selectMedia(image, $event)" @availability="setAvailability(image, $event)" @action="mediaAction(image, $event)" />
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
          <el-button type="primary" @click="upload()">
            <PicxIcon name="upload" :size="18" />
            {{ path === '/' ? $t('management_page.workspace.uploadRoot') : $t('management_page.workspace.uploadCurrent') }}
          </el-button>
        </template>
      </div>
    </div>
    <MoveImageDialog />
  </div>
</template>

<style scoped lang="stylus">
@import './imgs-management.styl'
</style>
