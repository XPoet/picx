<script setup lang="ts">
import type { UploadTargetSnapshot } from '@/common/model/upload'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GettingImages from '@/components/getting-images/getting-images.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import RepositoryContextBar from '@/components/repository-context-bar/repository-context-bar.vue'
import { useGithubConnection } from '@/composables/use-github-connection'
import { useUploadWorkspace } from '@/composables/use-upload-workspace'
import router from '@/router'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { displayDirectory } from '@/utils/directory-utils'
import { copyImageLink } from '@/utils/image-link-utils'
import { connectionLocation } from '@/utils/login-navigation'
import { getOSName } from '@/utils/system'
import UploadDirectoryDialog from './components/upload-directory-dialog.vue'
import UploadImageCard from './components/upload-image-card/upload-image-card.vue'
import UploadResultSummary from './components/upload-result-summary.vue'
import UploadSettingsPanel from './components/upload-settings-panel.vue'

const { t } = useI18n()
const store = usePicxStore(pinia)
const { connection, restore } = useGithubConnection()
const directoryVisible = ref(false)
const receiving = ref(false)
const gettingImages = useTemplateRef<InstanceType<typeof GettingImages>>('gettingImages')
const { queue, settings, runtime, processing, pending, pendingBytes, successes, connected, uploading, online, actionError, lastBatch, attemptedTotal, completed, canUpload, addFiles, remove, reset, upload, copyAll, setCompress, setWatermark, setFormat, retryProcessing, updateName } = useUploadWorkspace(undefined, { shortcutBlocked: () => directoryVisible.value, inputBusy: () => receiving.value, onReset: () => gettingImages.value?.reset() })
const userConfig = computed(() => store.getUserConfigInfo)
const repository = computed(() => {
  const { owner, repo, branch } = userConfig.value
  return owner && repo && branch ? { owner, repo, branch } : null
})
const uploadPath = computed(() => userConfig.value.selectedDir ? displayDirectory(userConfig.value.selectedDir) : t('upload_directory.incomplete'))
const shortcut = computed(() => getOSName() === 'mac' ? '⌘' : 'Ctrl')
let directoryTrigger: HTMLElement | null = null
function openDirectory() {
  if (uploading.value)
    return
  directoryTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  directoryVisible.value = true
}
async function returnDirectoryFocus() {
  await nextTick()
  if (directoryTrigger?.isConnected)
    directoryTrigger.focus({ preventScroll: true })
}
function copyItem(uuid: string) {
  const result = successes.value.find(result => result.uuid === uuid)
  if (result)
    void copyImageLink(result.image, false, result.target)
}
function reconnect() {
  if (!uploading.value)
    void router.push(connectionLocation('/upload'))
}
async function viewManagement(target: UploadTargetSnapshot) {
  try {
    store.SET_USER_CONFIG_INFO({ viewDir: target.dir })
    await router.push('/management')
  }
  catch {
    ElMessage.error(t('connection.storage-unavailable'))
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
onMounted(() => {
  if (repository.value && !userConfig.value.selectedDir && !directoryVisible.value)
    openDirectory()
  if (userConfig.value.token && connection.value.phase === 'disconnected')
    void restore()
})
</script>

<template>
  <RepositoryContextBar :repository="repository" :upload-path="uploadPath" :disabled="uploading" @configure="openDirectory" />
  <div class="upload-page-container">
    <div class="upload-page-main">
      <div v-if="!online" class="workspace-notice" role="alert">
        <PicxIcon name="info" :size="20" />{{ $t('request_error.offline') }}
      </div>
      <div v-else-if="!connected" class="workspace-notice" role="status">
        <span>{{ $t('repository_context.unverified') }}</span><el-button :disabled="uploading" @click="reconnect">
          {{ $t('repository_context.reconnect') }}
        </el-button>
      </div>
      <div v-if="actionError" class="workspace-notice" role="alert">
        {{ $t(`connection.${actionError}`) }}
      </div>
      <div v-if="receiving" class="workspace-notice" role="status">
        {{ $t('upload_workspace.receiving') }}
      </div>
      <div v-if="uploading" class="workspace-notice" role="status">
        {{ $t('upload_workspace.upload_progress', { completed, total: attemptedTotal }) }}
      </div>
      <UploadResultSummary v-if="lastBatch" :batch="lastBatch" @manage="viewManagement" @reconnect="reconnect" />
      <div class="upload-stage" :class="{ 'has-queue': queue.length, 'has-successes': successes.length }">
        <section v-if="queue.length" class="upload-page-left" tabindex="0">
          <div class="queue-heading">
            <h2>{{ $t('upload_workspace.queue') }}</h2><span>{{ successes.length }} / {{ queue.length }}</span>
          </div>
          <div v-for="item in queue" :key="item.uuid" class="uploaded-item">
            <UploadImageCard :img-obj="item" :runtime="runtime[item.uuid]" :naming="settings.imageName" :disabled="uploading" @remove="remove" @retry="retryProcessing" @edit-name="updateName" @copy="copyItem" />
          </div>
          <el-button class="queue-add" :disabled="uploading" @click="gettingImages?.selectFiles()">
            <PicxIcon name="plus" :size="18" />{{ $t('upload_workspace.add_more') }}
          </el-button>
        </section>
        <div class="upload-intake">
          <GettingImages ref="gettingImages" :disabled="uploading" mode="workspace" :has-files="queue.length > 0" video-enabled @get-img-list="addFiles" @receiving="receiving = $event" />
          <p v-if="successes.length" class="retained-note">
            {{ $t('upload_workspace.successes_retained', { count: successes.length }) }}
          </p>
        </div>
      </div>
    </div>
    <UploadSettingsPanel :settings="settings" :target="repository" :directory="userConfig.selectedDir || '/'" :display-path="uploadPath" :pending-count="pending.length" :pending-bytes="pendingBytes" :uploaded-count="successes.length" :has-items="queue.length > 0 || receiving" :busy="uploading" :processing="processing || receiving" :can-upload="canUpload" :shortcut="shortcut" @compress="setCompress" @watermark="setWatermark" @format="setFormat" @directory="openDirectory" @reset="reset" @upload="upload" @copy-all="copyAll">
      <template #deployment>
        <deploy-status-bar v-if="userConfig.logined" :disabled="!successes.length || uploading || !online || directoryVisible || !connected" />
      </template>
    </UploadSettingsPanel>
  </div>
  <UploadDirectoryDialog v-model="directoryVisible" @closed="returnDirectoryFocus" />
</template>

<style lang="stylus">
@import "./upload-image.styl"
</style>
