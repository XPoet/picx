<template>
  <div class="page-container management-page-container">
    <div class="content-container">
      <div class="top">
        <div class="left">
          <selected-info-bar bar-type="management" />
        </div>
        <div class="right flex-start">
          <el-tooltip
            placement="top"
            :content="$t('management.reload', { dir: userConfigInfo.viewDir })"
          >
            <el-icon class="btn-icon" @click.stop="reloadCurrentDirContent">
              <IEpRefresh />
            </el-icon>
          </el-tooltip>
        </div>
      </div>

      <div
        class="bottom"
        v-loading="loadingImageList"
        :element-loading-text="$t('management.loadingTxt1')"
      >
        <image-selector
          v-if="currentPathImageList.length"
          :currentDirImageList="currentPathImageList"
          @update:initImageList="currentPathImageList"
          :key="renderKey"
        ></image-selector>
        <ul
          class="image-management-list"
          :style="{
            height: isShowBatchTools ? 'calc(100% - 50rem)' : '100%'
          }"
          v-contextmenu="{ type: ContextmenuEnum.parentDir }"
        >
          <li class="image-management-item" v-if="userConfigInfo.viewDir !== '/'">
            <folder-card mode="back" />
          </li>
          <li
            class="image-management-item"
            v-for="(dir, index) in currentPathDirList"
            :key="'folder-card-' + dir.dir + '-' + index"
            v-contextmenu="{ type: ContextmenuEnum.childDir, dir: dir.dir }"
          >
            <folder-card :folder-obj="dir" />
          </li>
          <div style="width: 100%" />
          <li
            class="image-management-item image"
            v-for="(image, index) in currentPathImageList"
            :key="'image-card-' + index"
            v-contextmenu="{ type: ContextmenuEnum.img, img: image }"
          >
            <image-card :image-obj="image" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores'
import { getRepoPathContent } from '@/common/api'
import { filterDirContent, getDirContent } from '@/views/imgs-management/imgs-management.util'

import ImageCard from '@/components/image-card/image-card.vue'
import SelectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'
import FolderCard from '@/components/folder-card/folder-card.vue'
import ImageSelector from '@/components/image-selector/image-selector.vue'
import { UploadedImageModel, DirModeEnum, ContextmenuEnum } from '@/common/model'

const store = useStore()
const router = useRouter()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const loginStatus = computed(() => store.getters.getUserLoginStatus).value
const dirObject = computed(() => store.getters.getDirObject).value

const renderKey = ref(new Date().getTime()) // key for update image-selector component
const loadingImageList = ref(false)

const currentPathDirList = ref([])
const currentPathImageList = ref([])

const isShowBatchTools = ref(false)

async function dirContentHandle(dir: string) {
  loadingImageList.value = true

  const dirContent = getDirContent(dir, dirObject)
  if (dirContent) {
    const dirs = filterDirContent(dir, dirContent, 'dir')
    const images = filterDirContent(dir, dirContent, 'image')
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
      (dirMode === DirModeEnum.newDir || dirMode === DirModeEnum.autoDir) &&
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
  initDirImageList()
})

watch(
  () => loginStatus,
  (nv) => {
    if (nv === false) {
      router.push('/config')
    }
  }
)

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
      currentPathDirList.value = filterDirContent(viewDir, dirContent, 'dir')
      currentPathImageList.value = filterDirContent(viewDir, dirContent, 'image')
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
</script>

<style scoped lang="stylus">
@import './imgs-management.styl'
</style>
