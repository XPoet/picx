<script lang="ts" setup>
import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getRepoPathContent } from '@/common/api'
import { ContextmenuEnum } from '@/common/directive/types'
import { DirModeEnum, ImageSortEnum } from '@/common/model'
import { useImageUploadTime } from '@/composables/use-image-upload-time'
import router from '@/router'
import { useStore } from '@/stores'
import FolderCard from '@/views/imgs-management/components/folder-card/folder-card.vue'
import ImageCard from '@/views/imgs-management/components/image-card/image-card.vue'
import ImageSelector from '@/views/imgs-management/components/image-selector/image-selector.vue'
import MoveImageDialog from '@/views/imgs-management/components/move-image-dialog/move-image-dialog.vue'
import ToolsBar from '@/views/imgs-management/components/tools-bar/tools-bar.vue'
import {
  filterDirContent,
  getDirContent,
  shiftKeyHandle,
  sortDirList,
  sortImageList,
} from '@/views/imgs-management/imgs-management.util'

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const dirObject = computed(() => store.getters.getDirObject).value
const sortMode = computed(() => store.getters.getUserSettings.management.sort)

const renderKey = ref(Date.now()) // key for update image-selector component
const loadingImageList = ref(false)

const currentPathDirList = ref<DirObject[]>([])
const currentPathImageList = ref<UploadedImageModel[]>([])

// 排序仅作用于渲染顺序，Store 中目录树的真实顺序保持 GitHub API 返回顺序
const sortedDirList = computed(() => sortDirList(currentPathDirList.value, sortMode.value))
const sortedImageList = computed(() => sortImageList(currentPathImageList.value, sortMode.value))

const isShowBatchTools = ref(false)

const { backfillUploadTime, cancelBackfill } = useImageUploadTime()

async function dirContentHandle(dir: string) {
  loadingImageList.value = true

  const dirContent = getDirContent(dir, dirObject)
  if (dirContent) {
    const dirs = filterDirContent(dirContent, 'dir')
    const images = filterDirContent(dirContent, 'file')
    if (!dirs.length && !images.length) {
      await getRepoPathContent(userConfigInfo, dir)
    }
    else {
      currentPathDirList.value = dirs
      currentPathImageList.value = images
      store.commit('REPLACE_IMAGE_CARD', { checkedImgArr: currentPathImageList.value })
    }
  }
  else {
    await getRepoPathContent(userConfigInfo, dir)
  }
  loadingImageList.value = false
}

async function initDirImageList() {
  const { selectedDir, viewDir, dirMode } = userConfigInfo

  if (viewDir === '') {
    if (
      (dirMode === DirModeEnum.newDir || dirMode === DirModeEnum.dateDir)
      && !getDirContent(selectedDir, dirObject)
    ) {
      userConfigInfo.selectedDir = '/'
      userConfigInfo.dirMode = DirModeEnum.rootDir
    }

    if (userConfigInfo.selectedDir) {
      userConfigInfo.viewDir = userConfigInfo.selectedDir
    }
    else {
      userConfigInfo.viewDir = '/'
    }
  }

  if (!dirObject.imageList.length && !dirObject.childrenDirs.length) {
    await getRepoPathContent(userConfigInfo, userConfigInfo.viewDir)
    return
  }

  await dirContentHandle(userConfigInfo.viewDir)
}

// 重新加载当前目录内容（网络请求）
async function reloadCurrentDirContent() {
  const { viewDir } = userConfigInfo
  await store.dispatch('DIR_IMAGE_LIST_INIT_DIR', viewDir)
  loadingImageList.value = true
  await getRepoPathContent(userConfigInfo, viewDir)
  loadingImageList.value = false
}

onMounted(() => {
  shiftKeyHandle()
  initDirImageList()
})

watch(
  () => userConfigInfo.viewDir,
  async (nDir) => {
    await dirContentHandle(nDir)
    renderKey.value += 1
  },
  { deep: true },
)

watch(
  () => dirObject,
  (nv: any) => {
    const { viewDir } = userConfigInfo
    const dirContent = getDirContent(viewDir, nv)
    if (dirContent) {
      currentPathDirList.value = filterDirContent(dirContent, 'dir')
      currentPathImageList.value = filterDirContent(dirContent, 'file')
      store.commit('REPLACE_IMAGE_CARD', { checkedImgArr: currentPathImageList.value })
    }
  },
  { deep: true },
)

watch(
  () => currentPathImageList.value,
  (nv: UploadedImageModel[]) => {
    isShowBatchTools.value = nv.some(x => x.checked)
  },
  { deep: true },
)

// “最新上传优先”排序下，后台回填缺少上传时间的图片；其余排序模式取消回填
watch([currentPathImageList, sortMode], ([images, mode]) => {
  if (mode === ImageSortEnum.timeDesc && images.length) {
    backfillUploadTime(images)
  }
  else {
    cancelBackfill()
  }
})

onBeforeUnmount(() => {
  cancelBackfill()
})

watch(
  () => store.getters.getUploadAreaState.activeInfo,
  (nv) => {
    const { type, dir, img } = nv || {}

    currentPathImageList.value.forEach((item) => {
      item.active = type === ContextmenuEnum.img && item.name === img?.name
    })

    currentPathDirList.value.forEach((dirObj) => {
      dirObj.active = type === ContextmenuEnum.dir && dirObj.dir === dir
    })
  },
  { deep: true },
)
</script>

<template>
  <div class="page-container management-page-container">
    <div class="top-box border-box">
      <ToolsBar @reload="reloadCurrentDirContent" />
    </div>
    <div
      v-loading="loadingImageList"
      class="bottom-box border-box"
      :element-loading-text="$t('management_page.loadingTxt1')"
    >
      <ImageSelector
        v-if="currentPathImageList.length"
        :key="renderKey"
        :current-dir-image-list="currentPathImageList"
      />
      <div
        v-contextmenu="{ type: ContextmenuEnum.dirArea }"
        class="content-list-box border-box"
        :class="{ 'has-tools': isShowBatchTools }"
      >
        <ul v-if="sortedDirList.length" class="dir-card-list list-item border-box">
          <li v-for="dir in sortedDirList" :key="dir.dirPath" class="dir-card-item border-box">
            <FolderCard :class="`folder-card-${dir.dir}`" :folder-obj="dir" />
          </li>
        </ul>
        <ul v-if="sortedImageList.length" class="image-card-list list-item border-box">
          <li
            v-for="image in sortedImageList"
            :key="image.uuid"
            class="image-card-item border-box"
          >
            <ImageCard :image-obj="image" />
          </li>
        </ul>
        <el-empty v-if="!currentPathImageList.length && !currentPathDirList.length">
          <el-button type="primary" @click="router.push('/upload')">
            {{ $t('management_page.text_2') }}
          </el-button>
        </el-empty>
      </div>
    </div>
    <MoveImageDialog />
  </div>
</template>

<style scoped lang="stylus">
@import './imgs-management.styl'
</style>
