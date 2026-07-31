<script lang="ts" setup>
import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { computed, onMounted, ref, watch } from 'vue'
import { getRepoPathContent } from '@/common/api'
import { ContextmenuEnum } from '@/common/directive/types'
import { DirModeEnum } from '@/common/model'
import router from '@/router'
import { useStore } from '@/stores'
import FolderCard from '@/views/imgs-management/components/folder-card/folder-card.vue'
import ImageCard from '@/views/imgs-management/components/image-card/image-card.vue'
import ImageSelector from '@/views/imgs-management/components/image-selector/image-selector.vue'
import ToolsBar from '@/views/imgs-management/components/tools-bar/tools-bar.vue'
import {
  filterDirContent,
  getDirContent,
  shiftKeyHandle,
} from '@/views/imgs-management/imgs-management.util'

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const dirObject = computed(() => store.getters.getDirObject).value

const renderKey = ref(Date.now()) // key for update image-selector component
const loadingImageList = ref(false)

const currentPathDirList = ref<DirObject[]>([])
const currentPathImageList = ref<UploadedImageModel[]>([])

const isShowBatchTools = ref(false)

async function dirContentHandle(dir: string) {
  loadingImageList.value = true

  const dirContent = getDirContent(dir, dirObject)
  if (dirContent) {
    const dirs = filterDirContent(dirContent, 'dir')
    const images = filterDirContent(dirContent, 'image')
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
      currentPathImageList.value = filterDirContent(dirContent, 'image')
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
        <ul v-if="currentPathDirList.length" class="dir-card-list list-item border-box">
          <li v-for="dir in currentPathDirList" :key="dir.dirPath" class="dir-card-item border-box">
            <FolderCard :class="`folder-card-${dir.dir}`" :folder-obj="dir" />
          </li>
        </ul>
        <ul v-if="currentPathImageList.length" class="image-card-list list-item border-box">
          <li
            v-for="image in currentPathImageList"
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
  </div>
</template>

<style scoped lang="stylus">
@import './imgs-management.styl'
</style>
