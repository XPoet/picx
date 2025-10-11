<!-- eslint-disable no-unused-vars -->
<script lang="ts" setup>
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { Props } from './type'
import { useFilename } from './hooks/use-filename'
import { RENAME_MAX_LENGTH } from '@/common/constant'
import { store } from '@/stores'
import { getFileSize } from '@/utils/file-utils'
import { formatDatetime } from '@/utils/common-utils'
import { copyVideoLink } from '@/utils/video-utils'

const emits = defineEmits<{
  (e: 'remove', uuid: string): void
  (e: 'preview', videoItem: Props['videoItem']): void
}>()

const props = defineProps<Props>()

const instance = getCurrentInstance()

const userSettings = computed(() => store.getters.getUserSettings).value

const isLoading = computed(() => {
  return props.videoItem.uploadStatus.uploading
  // props.videoItem.beforeUploadStatus.compressing ||
  // props.videoItem.beforeUploadStatus.watermarking
})

const loadingText = computed(() => {
  const { uploadStatus } = props.videoItem
  if (uploadStatus.uploading) {
    return instance!.proxy!.$t('upload_page.uploading')
  }
  return ''
})

const videoNameOperateFolded = ref(true)

const {
  renameInputRef,
  fileNameOperateData,
  initFilename,
  onHashRename,
  onRename,
  onPrefixNaming
} = useFilename(props)

const handleCopyVideoLink = () => {
  if (props.videoItem.uploadedVideo) {
    copyVideoLink(props.videoItem.uploadedVideo)
  }
}

const remove = (uuid: string) => {
  emits('remove', uuid)
}

const handlePreview = () => {
  emits('preview', props.videoItem)
}

onMounted(async () => {
  await initFilename()
})
</script>

<template>
  <div
    class="upload-video-card-container"
    :class="{
      'wait-upload': !videoItem.uploadStatus.uploading && videoItem.uploadStatus.progress === 0,
      uploading: videoItem.uploadStatus.uploading && videoItem.uploadStatus.progress !== 100,
      uploaded: !videoItem.uploadStatus.uploading && videoItem.uploadStatus.progress === 100
    }"
  >
    <div
      class="video-show-container"
      v-loading="isLoading"
      :element-loading-text="loadingText"
      @click="handlePreview"
    >
      <video class="preview-video" v-if="videoItem.objectURL" :src="videoItem.objectURL" />
    </div>

    <div class="before-upload-handle-container">
      <div class="video-name-box" :class="{ 'no-border': videoItem.uploadStatus.progress === 100 }">
        <span class="video-name text-ellipsis">
          {{ videoItem.filename.final || videoItem.filename.name }}
        </span>
        <el-tooltip
          placement="top"
          :offset="8"
          :content="videoNameOperateFolded ? $t('upload_page.expand') : $t('upload_page.fold')"
          v-if="videoItem.uploadStatus.progress === 0"
        >
          <el-icon class="fold-btn" @click="videoNameOperateFolded = !videoNameOperateFolded">
            <IEpCaretBottom v-if="!videoNameOperateFolded" />
            <IEpCaretLeft v-if="videoNameOperateFolded" />
          </el-icon>
        </el-tooltip>
      </div>
      <div
        class="video-name-operate-box"
        :class="{ folded: videoNameOperateFolded }"
        v-if="videoItem.uploadStatus.progress === 0"
      >
        <!-- 哈希化 -->
        <div class="operate-item">
          <el-checkbox
            :label="$t('upload_page.add_hash')"
            v-model="fileNameOperateData.isAddHash"
            @change="onHashRename($event)"
          ></el-checkbox>
        </div>

        <!-- 重命名 -->
        <div class="operate-item">
          <el-checkbox
            :label="$t('rename')"
            v-model="fileNameOperateData.isRename"
            @change="onRename"
          ></el-checkbox>
          <el-input
            class="rename-input"
            size="small"
            v-if="videoItem.filename.isRename"
            v-model="fileNameOperateData.newName"
            @input="onRename"
            :maxlength="RENAME_MAX_LENGTH"
            ref="renameInputRef"
            clearable
          ></el-input>
        </div>

        <!-- 添加前缀 -->
        <div
          class="operate-item"
          v-if="
            !videoItem.filename.isRename &&
            userSettings.imageName.addPrefix.enable &&
            userSettings.imageName.addPrefix.prefix
          "
        >
          <el-checkbox
            :label="$t('upload_page.add_prefix')"
            v-model="fileNameOperateData.isAddPrefix"
            @change="onPrefixNaming($event)"
          ></el-checkbox>
        </div>
      </div>
      <div class="video-info-box" v-if="videoItem.uploadStatus.progress === 0">
        <div class="file-size-box">
          <span
            class="original-file-size file-size-item"
            :class="{ 'del-line': videoItem.fileInfo?.compressFile?.size }"
          >
            {{ getFileSize(videoItem.fileInfo.originalFile?.size || 0) }} KB
          </span>
          <span
            v-if="videoItem.fileInfo?.compressFile?.size"
            class="finial-file-size file-size-item"
          >
            {{ getFileSize(videoItem.fileInfo?.compressFile?.size) }} KB
          </span>
        </div>
        <span class="last-modified">
          {{ formatDatetime('yyyy-MM-dd hh:mm', videoItem.fileInfo.originalFile?.lastModified) }}
        </span>
      </div>
    </div>

    <div
      class="after-upload-handle-container flex-center"
      v-if="videoItem.uploadStatus.progress === 100"
      @click="handleCopyVideoLink()"
    >
      {{ $t('copy_video_link') }}
    </div>

    <el-tooltip
      v-if="videoItem.uploadStatus.progress === 0"
      placement="top"
      :offset="8"
      :content="$t('delete')"
    >
      <el-icon class="del-video-btn" @click="remove(videoItem.uuid)"><IEpRemove /></el-icon>
    </el-tooltip>

    <div
      class="upload-status-box"
      :class="{
        'wait-upload': !videoItem.uploadStatus.uploading && videoItem.uploadStatus.progress === 0,
        uploaded: !videoItem.uploadStatus.uploading && videoItem.uploadStatus.progress === 100
      }"
    >
      <el-icon>
        <IEpUpload
          v-if="!videoItem.uploadStatus.uploading && videoItem.uploadStatus.progress === 0"
        />
        <IEpCheck
          v-if="!videoItem.uploadStatus.uploading && videoItem.uploadStatus.progress === 100"
        />
      </el-icon>
    </div>
  </div>
</template>

<style lang="stylus">
@import "./upload-video-card.styl"
</style>
