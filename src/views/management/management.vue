<template>
  <div class="page-container management-page-container">
    <div class="content-container">
      <div class="top">
        <div class="left">
          <selected-info-bar />
        </div>
        <div class="right flex-start">
          <el-tooltip
            placement="top"
            :content="listing ? '切换方块展示' : '切换列表展示'"
          >
            <el-icon class="btn-icon" @click.stop="toggleListing">
              <Tickets v-if="listing" />
              <Menu v-if="!listing" />
            </el-icon>
          </el-tooltip>
          <el-tooltip placement="top" content="重新加载图片">
            <el-icon class="btn-icon" @click.stop="reloadCurrentDirContent">
              <Refresh />
            </el-icon>
          </el-tooltip>
        </div>
      </div>

      <div class="bottom" v-loading="loadingImageList" element-loading-text="加载中...">
        <image-selector
          v-if="currentPathImageList.length"
          :currentDirImageList="currentPathImageList"
          @update:initImageList="currentPathImageList"
          :key="renderKey"
        ></image-selector>
        <ul
          class="image-list"
          :style="{
            height: isShowBatchTools ? 'calc(100% - 50rem)' : '100%'
          }"
        >
          <li class="image-item" v-if="userConfigInfo.selectedDir !== '/'">
            <folder-card mode="back" />
          </li>
          <li class="image-item" v-for="(dir, index) in currentPathDirList" :key="index">
            <folder-card :folder-obj="dir" />
          </li>
          <div class="clear"></div>
          <li
            class="image-item"
            v-for="(image, index) in currentPathImageList"
            :key="index"
            :style="{
              width: listing ? '50%' : '230rem',
              height: listing ? '80rem' : '240rem'
            }"
          >
            <image-card
              :image-obj="image"
              :listing="listing"
              v-model="activeIndex"
              :index="index"
            />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { getContentByReposPath } from '@/common/api'
import {
  dirModeHandle,
  filterDirContent,
  getDirContent
} from '@/views/management/management.util'

import imageCard from '@/components/image-card/image-card.vue'
import selectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'
import folderCard from '@/components/folder-card/folder-card.vue'
import imageSelector from '@/components/image-selector/image-selector.vue'
import { UploadedImageModel } from '@/common/model/upload.model'

const store = useStore()
const router = useRouter()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const loggingStatus = computed(() => store.getters.getUserLoggingStatus).value
const dirObject = computed(() => store.getters.getDirObject).value

const renderKey = ref(new Date().getTime()) // key for update image-selector component
const loadingImageList = ref(false)
const listing = ref(false)
const activeIndex = ref<number>()

const currentPathDirList = ref([])
const currentPathImageList = ref([])

async function dirContentHandle(dir: string) {
  loadingImageList.value = true

  const dirContent = getDirContent(dir, dirObject)
  if (dirContent) {
    const dirs = filterDirContent(dir, dirContent, 'dir')
    const images = filterDirContent(dir, dirContent, 'image')
    if (!dirs.length && !images.length) {
      await getContentByReposPath(dir)
    } else {
      currentPathDirList.value = dirs
      currentPathImageList.value = images
      store.commit('REPLACE_IMAGE_CARD', { checkedImgArr: currentPathImageList.value })
    }
  } else {
    await getContentByReposPath(dir)
  }
  loadingImageList.value = false
}

async function initDirImageList() {
  const { selectedDir, dirMode } = userConfigInfo

  if (
    (dirMode === 'newDir' || dirMode === 'autoDir') &&
    !getDirContent(selectedDir, dirObject)
  ) {
    userConfigInfo.selectedDir = '/'
    userConfigInfo.dirMode = 'rootDir'
  }

  if (!dirObject.imageList.length && !dirObject.childrenDirs.length) {
    await getContentByReposPath(userConfigInfo.selectedDir)
    return
  }

  await dirContentHandle(userConfigInfo.selectedDir)
}

function toggleListing() {
  listing.value = !listing.value
}

// 重新加载当前目录内容（网络请求）
async function reloadCurrentDirContent() {
  const { selectedDir } = userConfigInfo
  await store.dispatch('DIR_IMAGE_LIST_INIT_DIR', selectedDir)
  loadingImageList.value = true
  await getContentByReposPath(selectedDir)
  loadingImageList.value = false
}

onMounted(() => {
  initDirImageList()
})

watch(
  () => loggingStatus,
  (nv) => {
    if (nv === false) {
      router.push('/config')
    }
  }
)

watch(
  () => userConfigInfo.selectedDir,
  async (nDir) => {
    dirModeHandle(nDir, store)
    await dirContentHandle(nDir)
    renderKey.value += 1
  },
  { deep: true }
)

watch(
  () => dirObject,
  (nv: any) => {
    const { selectedDir } = userConfigInfo
    const dirContent = getDirContent(selectedDir, nv)
    if (dirContent) {
      currentPathDirList.value = filterDirContent(selectedDir, dirContent, 'dir')
      currentPathImageList.value = filterDirContent(selectedDir, dirContent, 'image')
      store.commit('REPLACE_IMAGE_CARD', { checkedImgArr: currentPathImageList.value })
    }
  },
  { deep: true }
)

const isShowBatchTools = ref(false)
watch(
  () => currentPathImageList.value,
  (nv: UploadedImageModel[]) => {
    isShowBatchTools.value = nv.filter((x) => x.checked).length > 0
  },
  { deep: true }
)
</script>

<style scoped lang="stylus">
@import 'management.styl';
</style>
