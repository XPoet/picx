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
            <i
              class="btn-icon"
              :class="listing ? 'el-icon-tickets' : 'el-icon-menu'"
              @click.stop="toggleListing"
            ></i>
          </el-tooltip>
          <el-tooltip placement="top" content="重新加载图片">
            <i class="btn-icon el-icon-refresh" @click.stop="reloadPics"></i>
          </el-tooltip>
        </div>
      </div>

      <div
        class="bottom"
        v-loading="loadingImageList"
        element-loading-text="加载中..."
        element-loading-background="rgba(0, 0, 0, 0.5)"
      >
        <ul class="image-list">
          <li class="image-item" v-if="userConfigInfo.selectedDir !== '/'">
            <folder-card mode="back" />
          </li>
          <li class="image-item" v-for="(dir, index) in currentPathDirList" :key="index">
            <folder-card :folder-obj="dir" />
          </li>
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
import { filenameHandle, isImage } from '@/common/utils/file-handle-helper'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import { UploadedImageModel } from '@/common/model/upload.model'
import generateExternalLink from '@/common/utils/generate-external-link'
import getUuid from '@/common/utils/get-uuid'
import axios from '@/common/utils/axios'
import { getContentByReposPath } from '@/common/api'

import imageCard from '@/components/image-card/image-card.vue'
import selectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'
import folderCard from '@/components/folder-card/folder-card.vue'
import { filterDirContent, getDirContent } from '@/views/management/management.util'

const store = useStore()
const router = useRouter()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const loggingStatus = computed(() => store.getters.getUserLoggingStatus).value
const dirImageList = computed(() => store.getters.getDirImageList).value

const loadingImageList = ref(false)
const listing = ref(false)
const activeIndex = ref<number>()

const currentPathDirList = ref([])
const currentPathImageList = ref([])

async function dirContentHandle(dir: string) {
  loadingImageList.value = true

  const dirContent = getDirContent(dir, dirImageList)
  if (dirContent) {
    const dirs = filterDirContent(dir, dirContent, 'dir')
    const images = filterDirContent(dir, dirContent, 'image')

    if (!dirs.length && !images.length) {
      await getContentByReposPath(dir)
    } else {
      currentPathDirList.value = dirs
      currentPathImageList.value = images
    }
  } else {
    await getContentByReposPath(dir)
  }
  loadingImageList.value = false
}

async function initDirImageList() {
  const { selectedDir } = userConfigInfo

  if (!dirImageList.length) {
    await getContentByReposPath(selectedDir)
    return
  }

  await dirContentHandle(selectedDir)
}

function toggleListing() {
  listing.value = !listing.value
}

// 重新加载
function reloadPics() {
  store.dispatch('DIR_IMAGE_LOGOUT')
  initDirImageList()
}

onMounted(() => {
  initDirImageList()
})

watch(
  () => loggingStatus,
  (nv) => {
    if (nv.value === false) {
      router.push('/config')
    }
  }
)

watch(
  () => userConfigInfo.selectedDir,
  async (nDir) => {
    await dirContentHandle(nDir)
  },
  { deep: true }
)

watch(
  () => dirImageList,
  (nv: any) => {
    const { selectedDir } = userConfigInfo
    const dirContent = getDirContent(selectedDir, nv)
    if (dirContent) {
      currentPathDirList.value = filterDirContent(selectedDir, dirContent, 'dir')
      currentPathImageList.value = filterDirContent(selectedDir, dirContent, 'image')
    }
  },
  { deep: true }
)
</script>

<style scoped lang="stylus">
@import 'management.styl';
</style>
