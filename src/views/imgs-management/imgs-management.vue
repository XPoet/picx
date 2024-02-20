<template>
  <div class="page-container management-page-container">
    <div class="top-box border-box">
      <tools-bar @reload="reloadCurrentDirContent" />
    </div>
    <div
      class="bottom-box border-box"
      v-loading="loadingImageList"
      :element-loading-text="$t('management_page.loadingTxt1')"
    >
      <image-selector
        v-if="currentPathImageList.length"
        :currentDirImageList="currentPathImageList"
        @updateInitImageList="currentPathImageList as any"
        :key="renderKey"
      ></image-selector>
      <div
        class="content-list-box border-box"
        :class="{ 'has-tools': isShowBatchTools }"
        v-contextmenu="{ type: ContextmenuEnum.dirArea }"
      >
        <ul class="dir-card-list list-item border-box" v-if="currentPathDirList.length">
          <li
            class="dir-card-item border-box"
            v-for="(dir, idx) in currentPathDirList"
            :key="'folder-card-' + dir.dir + '-' + idx"
          >
            <folder-card :class="'folder-card-' + idx" :folder-obj="dir" />
          </li>
        </ul>
        <ul class="image-card-list list-item border-box" v-if="currentPathImageList.length">
          <li
            class="image-card-item border-box"
            v-for="(image, idx) in currentPathImageList"
            :key="'image-card-' + idx"
          >
            <image-card :image-obj="image" />
          </li>
        </ul>
        <el-empty v-if="!currentPathImageList.length && !currentPathDirList.length">
          <el-button type="primary" @click="router.push('/upload')">{{
            $t('management_page.text_2')
          }}</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from '@/stores'
import { getRepoPathContent } from '@/common/api'
import {
  filterDirContent,
  getDirContent,
  shiftKeyHandle
} from '@/views/imgs-management/imgs-management.util'
import { DirModeEnum, UploadedImageModel } from '@/common/model'
import { ContextmenuEnum } from '@/common/directive/types'
import ImageSelector from '@/views/imgs-management/components/image-selector/image-selector.vue'
import ToolsBar from '@/views/imgs-management/components/tools-bar/tools-bar.vue'
import FolderCard from '@/views/imgs-management/components/folder-card/folder-card.vue'
import ImageCard from '@/views/imgs-management/components/image-card/image-card.vue'
import router from '@/router'

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const dirObject = computed(() => store.getters.getDirObject).value

const renderKey = ref(new Date().getTime()) // key for update image-selector component
const loadingImageList = ref(false)

const currentPathDirList = ref<any[]>([])
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
    } else {
      currentPathDirList.value = dirs
      currentPathImageList.value = images
      store.commit('REPLACE_IMAGE_CARD', { checkedImgArr: currentPathImageList.value })
    }
  } else {
    await getRepoPathContent(userConfigInfo, dir)
  }
  loadingImageList.value = false
}

async function initDirImageList() {
  const { selectedDir, viewDir, dirMode } = userConfigInfo

  if (viewDir === '') {
    if (
      (dirMode === DirModeEnum.newDir || dirMode === DirModeEnum.dateDir) &&
      !getDirContent(selectedDir, dirObject)
    ) {
      userConfigInfo.selectedDir = '/'
      userConfigInfo.dirMode = 'rootDir'
    }

    if (userConfigInfo.selectedDir) {
      userConfigInfo.viewDir = userConfigInfo.selectedDir
    } else {
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
  { deep: true }
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
  { deep: true }
)

watch(
  () => currentPathImageList.value,
  (nv: UploadedImageModel[]) => {
    isShowBatchTools.value = nv.filter((x) => x.checked).length > 0
  },
  { deep: true }
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
  { deep: true }
)
</script>

<style scoped lang="stylus">
@import './imgs-management.styl'
</style>
