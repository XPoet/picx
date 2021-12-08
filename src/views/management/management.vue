<template>
  <div class="page-container management-page-container">
    <div class="content-container">
      <div class="top">
        <div class="left">
          <selected-info-bar @selected-dir-change="dirChange" />
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
          <li
            class="image-item"
            v-for="(image, index) in currentDirImageList"
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
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import { UploadedImageModel } from '@/common/model/upload.model'
import generateExternalLink from '@/common/utils/generate-external-link'
import getUuid from '@/common/utils/get-uuid'
import axios from '@/common/utils/axios'
import imageCard from '@/components/image-card/image-card.vue'
import selectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'

const store = useStore()
const router = useRouter()

const userConfigInfo = computed(
  (): UserConfigInfoModel => store.getters.getUserConfigInfo
)
const loggingStatus = computed(() => store.getters.getUserLoggingStatus)
const dirImageList = computed(() => store.getters.getDirImageList)

const currentDirImageList = ref([])
const loadingImageList = ref(false)
const listing = ref(false)
const activeIndex = ref<number>()

function isHasDir(selectedDir: string) {
  return userConfigInfo.value.dirList.some((v: any) => v.value === selectedDir)
}

function getImageObject(item: any, selectedDir: string): UploadedImageModel {
  return {
    uuid: getUuid(),
    dir: selectedDir,
    name: item.name,
    path: item.path,
    sha: item.sha,
    github_url: generateExternalLink(ExternalLinkType.gh, item, userConfigInfo.value),
    cdn_url: generateExternalLink(ExternalLinkType.cdn, item, userConfigInfo.value),
    md_gh_url: generateExternalLink(ExternalLinkType.md_gh, item, userConfigInfo.value),
    md_cdn_url: generateExternalLink(ExternalLinkType.md_cdn, item, userConfigInfo.value),
    deleting: false,
    is_transform_md: false,
    size: item.size
  }
}

// 获取指定目录的内容
function getDirContent(selectedDir: string) {
  loadingImageList.value = true

  const temp = { dir: selectedDir, imageList: [] as any[] }

  axios
    .get(
      `/repos/${userConfigInfo.value.owner}/${userConfigInfo.value.selectedRepos}/contents/${selectedDir}`
    )
    .then((res) => {
      if (res && res.status === 200 && res.data.length > 0) {
        const tempImageList: UploadedImageModel[] = []
        // eslint-disable-next-line no-restricted-syntax
        for (const item of res.data) {
          if (item.type === 'file' && isImage(filenameHandle(item.name).suffix)) {
            tempImageList.push(getImageObject(item, selectedDir))
          }
        }
        temp.imageList = tempImageList
        store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE_LIST', temp)
        loadingImageList.value = false
      }
    })
}

function dirChange(dir: string) {
  const targetDirObj = dirImageList.value.find((v: any) => v.dir === dir)
  if (!targetDirObj || !targetDirObj.imageList.length) {
    getDirContent(dir)
    return
  }
  currentDirImageList.value = targetDirObj.imageList
}

function getReposContent() {
  axios
    .get(
      `/repos/${userConfigInfo.value.owner}/${userConfigInfo.value.selectedRepos}/contents`
    )
    .then((res) => {
      console.log('[getReposContent] ', res)
      if (res && res.status === 200 && res.data.length > 0) {
        store.dispatch('DIR_IMAGE_LIST_ADD_DIR', '/')

        // eslint-disable-next-line no-restricted-syntax
        for (const item of res.data) {
          if (item.type === 'dir') {
            store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.name)
          } else if (item.type === 'file' && isImage(filenameHandle(item.name).suffix)) {
            store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', getImageObject(item, '/'))
          }
        }

        // 如果 userConfig.dirList 无 selectedDir，则切换显示根目录下（ / ）图片
        if (!isHasDir(userConfigInfo.value.selectedDir)) {
          userConfigInfo.value.selectedDir = '/'
        }
        dirChange(userConfigInfo.value.selectedDir)
      }
    })
}

function initDirImageList() {
  if (!dirImageList.value.length) {
    getReposContent()
    return
  }

  const { selectedDir } = userConfigInfo.value
  const targetDirObj = dirImageList.value.find((v: any) => v.dir === selectedDir)

  if (!targetDirObj) {
    if (isHasDir(selectedDir)) {
      getDirContent(selectedDir)
    }
    return
  }

  if (targetDirObj.imageList.length > 0) {
    currentDirImageList.value = targetDirObj.imageList
  } else {
    // 请求该目录内容
    getDirContent(selectedDir)
  }
}

function toggleListing() {
  listing.value = !listing.value
}

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
  () => dirImageList,
  (_n: any) => {
    const temp = _n.value.find((v: any) => v.dir === userConfigInfo.value.selectedDir)
    if (temp) {
      currentDirImageList.value = temp.imageList
    }
  },
  { deep: true }
)
</script>

<style scoped lang="stylus">
@import 'management.styl';
</style>
