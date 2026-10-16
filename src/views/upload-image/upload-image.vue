<script lang="ts" setup>
import type { ImageHandleResult, UploadedImageModel, UploadImageModel, UserConfigInfoModel } from '@/common/model'
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DirModeEnum, UploadStatusEnum } from '@/common/model'
import GettingImages from '@/components/getting-images/getting-images.vue'
import RepositoryContextBar from '@/components/repository-context-bar/repository-context-bar.vue'
import { useGithubConnection } from '@/composables/use-github-connection'
import { useUploadWorkspace } from '@/composables/use-upload-workspace'
import router from '@/router'
import { pinia, store } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { batchCopyImageLinks, copyImageLink, getOSName } from '@/utils'
import { directoryDraft, displayDirectory, resolveUploadTarget, validateDirectoryDraft } from '@/utils/directory-utils'
import { connectionLocation } from '@/utils/login-navigation'
import { uploadImagesToGitHub, uploadImageToGitHub } from '@/utils/upload-utils'
import UploadDirectoryDialog from './components/upload-directory-dialog.vue'
import UploadDirectorySummary from './components/upload-directory-summary.vue'
import UploadImageCard from './components/upload-image-card/upload-image-card.vue'
import { generateUploadImageObject } from './upload-image.util'

const instance = getCurrentInstance()
const picxStore = usePicxStore(pinia)
const { connection, busy: connectionBusy, restore } = useGithubConnection()

const gettingImagesRef = ref<InstanceType<typeof GettingImages> | null>(null)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const repository = computed(() => userConfigInfo.owner && userConfigInfo.repo && userConfigInfo.branch
  ? { owner: userConfigInfo.owner, repo: userConfigInfo.repo, branch: userConfigInfo.branch }
  : null)
const uploadPath = computed(() => userConfigInfo.selectedDir ? displayDirectory(userConfigInfo.selectedDir) : String(instance?.proxy?.$t('upload_directory.incomplete') ?? ''))
const logoutStatus = computed(() => store.getters.getUserLoginStatus)

const { queue: uploadImageList, runtime, processing, retryProcessing } = useUploadWorkspace()
const skippedProcessing = (uuid: string) => {
  const state = runtime.value[uuid]
  return state?.phase === 'ready' && state.skippedProcessing
}
const uploading = ref(false)
const directoryVisible = ref(false)
let directoryTrigger: HTMLElement | null = null
function openDirectory() {
  directoryTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  directoryVisible.value = true
}
async function returnDirectoryFocus() {
  await nextTick()
  if (directoryTrigger?.isConnected)
    directoryTrigger.focus({ preventScroll: true })
}
const shortcutKey = computed(() => (getOSName() === 'mac' ? '⌘' : 'Ctrl'))

const isCanDeploy = ref(false)

const setImgList = (imgList: ImageHandleResult[]) => {
  imgList.forEach((v) => {
    store.dispatch('UPLOAD_IMG_LIST_ADD', generateUploadImageObject(v))
  })
}

// 重置选择图片的公共组件
const resetGettingImages = () => {
  gettingImagesRef.value?.reset()
}

// 上传图片的具体操作

const doUploadImages = async (imgList: UploadImageModel[], targetConfig: UserConfigInfoModel) => {
  // 单张图片
  if (imgList.length === 1) {
    if (await uploadImageToGitHub(targetConfig, imgList[0])) {
      return UploadStatusEnum.uploaded
    }
    return UploadStatusEnum.uploadFail
  }

  // 多张图片
  if (imgList.length > 1) {
    if (await uploadImagesToGitHub(targetConfig, imgList)) {
      return UploadStatusEnum.allUploaded
    }
    return UploadStatusEnum.uploadFail
  }
}

// 上传成功之后的操作
const afterUploadSuccess = async (uploadedImg: UploadedImageModel[], isBatch: boolean = false) => {
  resetGettingImages()
  // 自动复制图片链接到系统剪贴板
  if (isBatch) {
    batchCopyImageLinks(uploadedImg, true)
  }
  else {
    copyImageLink(uploadedImg[0], true)
  }
  await store.dispatch('SET_USER_CONFIG_INFO', {
    viewDir: uploadedImg[0]?.dir ?? userConfigInfo.viewDir,
  })
}

// 上传
const uploadImage = async () => {
  if (uploading.value || picxStore.uploadTargetBusy)
    return
  if (connectionBusy.value)
    return
  const { token, repo, branch, owner, selectedDir } = userConfigInfo
  const current = connection.value
  if (!token || !repo || !branch || !owner || current.phase !== 'connected'
    || current.repository.owner !== owner || current.repository.repo !== repo || current.repository.branch !== branch) {
    ElMessage.warning({ message: instance?.proxy?.$t('repository_context.unverified') })
    await router.push(connectionLocation('/upload'))
    return
  }
  if (!selectedDir) {
    openDirectory()
    return
  }

  if (processing.value)
    return
  const notYetUploadList = uploadImageList.value.filter(x => x.uploadStatus.progress === 0 && runtime.value[x.uuid]?.phase === 'ready')

  if (notYetUploadList.length === 0) {
    ElMessage.error({ message: instance?.proxy?.$t('upload_page.message4') })
    return
  }

  if (userConfigInfo.dirMode === DirModeEnum.dateDir) {
    const resolved = validateDirectoryDraft(directoryDraft(userConfigInfo))
    if (!resolved.ok || !picxStore.SAVE_UPLOAD_DIRECTORY(resolved.value).ok) {
      ElMessage.error({ message: instance?.proxy?.$t('connection.storage-unavailable') })
      return
    }
  }
  const target = resolveUploadTarget(userConfigInfo)
  const targetConfig = { ...userConfigInfo, selectedDir: target.dir }
  uploading.value = true
  picxStore.uploadTargetBusy = true
  let uploadRes: UploadStatusEnum | undefined
  try {
    uploadRes = await doUploadImages(notYetUploadList, targetConfig)
  }
  finally {
    uploading.value = false
    picxStore.uploadTargetBusy = false
  }
  const uploadedImg = notYetUploadList
    .filter(v => v.uploadStatus.progress === 100)
    .map((x: UploadImageModel) => x.uploadedImg!)

  switch (uploadRes) {
    // 单张图片上传成功
    case UploadStatusEnum.uploaded:
      ElMessage.success({ message: instance?.proxy?.$t('upload_page.message5') })
      await afterUploadSuccess(uploadedImg)
      break

    // 多张图片上传成功
    case UploadStatusEnum.allUploaded:
      ElMessage.success({ message: instance?.proxy?.$t('upload_page.message6') })
      await afterUploadSuccess(uploadedImg, true)
      break

    // 上传失败（网络错误等原因）
    case UploadStatusEnum.uploadFail:
      ElMessage.error({ message: instance?.proxy?.$t('upload_page.message7') })
  }
}

// 重置
const resetUploadInfo = () => {
  if (uploading.value || picxStore.uploadTargetBusy)
    return
  uploading.value = false
  isCanDeploy.value = false
  store.dispatch('UPLOAD_IMG_LIST_RESET')
  resetGettingImages()
}

// 删除
const remove = (uuid: string) => {
  store.dispatch('UPLOAD_IMG_LIST_REMOVE', uuid)
  gettingImagesRef.value?.remove(uuid)
}

watch(
  () => logoutStatus,
  (_n) => {
    // 如果退出登录，清空信息

    !_n && resetUploadInfo()
  },
)

watch(() => uploadImageList.value.some(item => item.uploadStatus.progress === 100), value => isCanDeploy.value = value, { immediate: true })

function onKeydown(event: KeyboardEvent) {
  if (directoryVisible.value || (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')))
    return
  if (!(event.ctrlKey || event.metaKey) || event.repeat)
    return
  if (event.key.toLowerCase() === 'a' && uploadImageList.value.length && !uploading.value) {
    resetUploadInfo()
    event.preventDefault()
  }
  if (event.key.toLowerCase() === 's' && !uploading.value) {
    uploadImage()
    event.preventDefault()
  }
}

watch(() => router.currentRoute.value.query.directory, async (flag) => {
  if (flag !== '1')
    return
  if (!repository.value) {
    await router.replace(connectionLocation('/upload'))
    return
  }
  const query = { ...router.currentRoute.value.query }
  delete query.directory
  await router.replace({ path: '/upload', query })
  await nextTick()
  openDirectory()
}, { immediate: true })

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  if (repository.value && !userConfigInfo.selectedDir && !directoryVisible.value)
    openDirectory()
  if (userConfigInfo.token && connection.value.phase === 'disconnected')
    restore()
})
</script>

<template>
  <RepositoryContextBar
    :repository="repository"
    :upload-path="uploadPath"
    :connection="connection"
    :disabled="uploading"
    @configure="openDirectory"
    @reconnect="router.push(connectionLocation('/upload'))"
  />
  <div class="upload-page-container">
    <!-- 左侧 / 上传图片列表 -->
    <div
      v-if="uploadImageList.length"
      class="upload-page-left page-container"
      role="region"
      tabindex="0"
      :aria-label="$t('upload_page.queue_label')"
    >
      <div v-for="item in uploadImageList" :key="item.uuid" class="uploaded-item">
        <UploadImageCard :img-obj="item" @remove="remove($event)" />
        <div v-if="runtime[item.uuid]?.phase === 'failed'" role="alert">
          <p>{{ $t('upload_workspace.processing_failed') }}</p>
          <el-button @click="retryProcessing(item.uuid)">
            {{ $t('upload_workspace.retry_processing') }}
          </el-button>
        </div>
        <p v-if="skippedProcessing(item.uuid)">
          {{ $t('upload_workspace.processing_skipped') }}
        </p>
      </div>
    </div>

    <!-- 右侧 / 上传操作 -->
    <div class="upload-page-right page-container" :class="{ 'has-left': uploadImageList.length }">
      <!-- 选择图片区域 -->
      <div class="row-item">
        <div class="content-box">
          <GettingImages
            ref="gettingImagesRef"
            :disabled="uploading"
            mode="workspace"
            :has-files="uploadImageList.length > 0"
            video-enabled
            @get-img-list="setImgList"
          />
        </div>
      </div>

      <!-- 状态信息区域 -->
      <div class="row-item">
        <div class="content-box upload-area-status">
          <UploadDirectorySummary v-if="repository" :path="uploadPath" :disabled="uploading" @change="openDirectory" />
          <span v-if="uploadImageList.length" class="upload-count">
            {{ $t('uploaded') }}：{{
              uploadImageList.filter((x) => x.uploadStatus.progress === 100).length
            }}
            /
            {{ uploadImageList.length }}
          </span>
        </div>
      </div>

      <!-- 部署 -->
      <div v-if="userConfigInfo.logined" class="row-item">
        <div class="content-box">
          <deploy-status-bar :disabled="!isCanDeploy || uploading || directoryVisible || connection.phase !== 'connected'" />
        </div>
      </div>

      <!-- 重置 & 上传   -->
      <div v-if="uploadImageList.length" class="row-item">
        <div class="content-box operation-btn">
          <el-button :disabled="uploading" plain type="warning" @click="resetUploadInfo">
            {{ $t('reset') }} <span class="shortcut-key">{{ shortcutKey }} A</span>
          </el-button>
          <el-button :disabled="uploading || processing" plain type="primary" @click="uploadImage">
            {{ $t('upload') }} <span class="shortcut-key">{{ shortcutKey }} S</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
  <UploadDirectoryDialog v-model="directoryVisible" @closed="returnDirectoryFocus" />
</template>

<style lang="stylus">
@import "./upload-image.styl"
</style>
