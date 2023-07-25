<template>
  <div
    class="upload-image-card-container"
    :class="{
      'wait-upload': !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 0,
      uploading: imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress !== 100,
      uploaded: !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 100
    }"
  >
    <div
      class="img-show-container"
      v-loading="
        imgObj.uploadStatus.uploading ||
        imgObj.beforeUploadStatus.compressing ||
        imgObj.beforeUploadStatus.watermarking
      "
      :element-loading-text="loadingText"
    >
      <el-image
        :src="
          imgObj.base64.compressBase64 ||
          imgObj.base64.watermarkBase64 ||
          imgObj.base64.originalBase64
        "
        fit="cover"
        loading="lazy"
        :hide-on-click-modal="true"
        :preview-src-list="[
          imgObj.base64.compressBase64 ||
            imgObj.base64.watermarkBase64 ||
            imgObj.base64.originalBase64
        ]"
      />
    </div>

    <div class="before-upload-handle-container">
      <div class="img-name-box" :class="{ 'no-border': imgObj.uploadStatus.progress === 100 }">
        <span class="img-name text-ellipsis">
          {{ imgObj.filename.final || imgObj.filename.name }}
        </span>
        <el-tooltip
          placement="top"
          :offset="8"
          :content="imgNameOperateFolded ? $t('upload.expand') : $t('upload.fold')"
          v-if="imgObj.uploadStatus.progress === 0"
        >
          <el-icon class="fold-btn" @click="imgNameOperateFolded = !imgNameOperateFolded">
            <IEpCaretBottom v-if="!imgNameOperateFolded" />
            <IEpCaretLeft v-if="imgNameOperateFolded" />
          </el-icon>
        </el-tooltip>
      </div>
      <div
        class="img-name-operate-box"
        :class="{ folded: imgNameOperateFolded }"
        v-if="imgObj.uploadStatus.progress === 0"
      >
        <!-- 哈希化 -->
        <div class="operate-item">
          <el-checkbox
            :label="$t('upload.hash')"
            v-model="fileNameOperateData.isHash"
            @change="onHashRename($event)"
          ></el-checkbox>
        </div>

        <!-- 重命名 -->
        <div class="operate-item">
          <el-checkbox
            :label="$t('upload.rename')"
            v-model="fileNameOperateData.isRename"
            @change="onRename"
          ></el-checkbox>
          <el-input
            class="rename-input"
            size="small"
            v-if="imgObj.filename.isRename"
            v-model="fileNameOperateData.newName"
            @input="onRename"
            :maxlength="RENAME_MAX_LENGTH"
            ref="renameInputRef"
            clearable
          ></el-input>
        </div>

        <!-- 时间戳命名 -->
        <div class="operate-item">
          <el-checkbox
            :label="$t('upload.timestamp-naming')"
            v-model="fileNameOperateData.isTimestampNaming"
            @change="onTimestampNaming"
          ></el-checkbox>
        </div>

        <!-- 命名前缀 -->
        <div
          class="operate-item"
          v-if="
            !imgObj.filename.isRename &&
            userSettings.imageName.prefixNaming.enable &&
            userSettings.imageName.prefixNaming.prefix
          "
        >
          <el-checkbox
            :label="$t('upload.prefixNaming')"
            v-model="fileNameOperateData.isPrefixNaming"
            @change="onPrefixNaming($event)"
          ></el-checkbox>
        </div>
      </div>
      <div class="img-info-box" v-if="imgObj.uploadStatus.progress === 0">
        <div class="file-size-box">
          <span
            class="original-file-size file-size-item"
            :class="{ 'del-line': imgObj.fileInfo?.compressFile?.size }"
          >
            {{ getFileSize(imgObj.fileInfo.originalFile?.size) }} KB
          </span>
          <span v-if="imgObj.fileInfo?.compressFile?.size" class="finial-file-size file-size-item">
            {{ getFileSize(imgObj.fileInfo?.compressFile?.size) }} KB
          </span>
        </div>
        <span class="last-modified">
          {{ formatDatetime('yyyy-MM-dd hh:mm', imgObj.fileInfo.originalFile?.lastModified) }}
        </span>
      </div>
    </div>

    <div
      class="after-upload-handle-container flex-center"
      v-if="imgObj.uploadStatus.progress === 100"
      @click="copyImageLink(imgObj.uploadedImg, userConfigInfo, userSettings)"
    >
      {{ $t('upload.copyLink') }}
    </div>

    <el-tooltip
      v-if="imgObj.uploadStatus.progress === 0"
      placement="top"
      :offset="8"
      :content="$t('upload.delete')"
    >
      <el-icon class="del-img-btn" @click="remove(imgObj.uuid)"><IEpRemove /></el-icon>
    </el-tooltip>

    <div
      class="upload-status-box"
      :class="{
        'wait-upload': !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 0,
        uploaded: !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 100
      }"
    >
      <el-icon>
        <IEpUpload v-if="!imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 0" />
        <IEpCheck v-if="!imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 100" />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */

import { computed, getCurrentInstance, onMounted, reactive, ref, watch } from 'vue'
import { copyImageLink } from '@/utils'
import { UploadImageModel } from '@/common/model'
import { useStore } from '@/stores'
import { getFileSize } from '@/utils/file-utils'
import { formatDatetime } from '@/utils/common-utils'
import { hashRename, initImgSettings, prefixNamingTrans, rename } from './upload-image-card.util'
import { RENAME_MAX_LENGTH } from '@/common/constant'

const store = useStore()
const instance = getCurrentInstance()

const props = defineProps({
  imgObj: {
    type: Object as () => UploadImageModel,
    require: true,
    default: () => ({})
  }
})

const emit = defineEmits(['remove'])

const renameInputRef = ref<any>(null)

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const loadingText = ref('')

const fileNameOperateData = reactive({
  isHash: false,
  isPrefixNaming: false,
  isTimestampNaming: false,
  isRename: false,
  newName: ''
})

const imgNameOperateFolded = ref<boolean>(true)

const remove = (uuid: string) => {
  emit('remove', uuid)
}

const onRename = () => {
  props.imgObj!.filename.newName = fileNameOperateData.newName
  setTimeout(() => {
    renameInputRef.value?.focus()
  }, 100)
  rename(fileNameOperateData.isRename, props.imgObj)
}

const onHashRename = (e: boolean) => {
  fileNameOperateData.isTimestampNaming = false
  hashRename(e, props.imgObj)
}

const onPrefixNaming = (e: boolean) => {
  fileNameOperateData.isTimestampNaming = false
  prefixNamingTrans(e, props.imgObj)
}

const onTimestampNaming = (e: boolean) => {
  const { suffix, isPrefixNaming, isAddHash } = props.imgObj!.filename
  if (e) {
    fileNameOperateData.isHash = false
    fileNameOperateData.isPrefixNaming = false
    props.imgObj!.filename.final = `${Date.now()}.${suffix}`
  } else {
    prefixNamingTrans(isPrefixNaming, props.imgObj)
    hashRename(isAddHash, props.imgObj)
    fileNameOperateData.isHash = isAddHash
    fileNameOperateData.isPrefixNaming = isPrefixNaming
  }
}

const initFilename = () => {
  const { imageName } = userSettings
  if (props.imgObj!.uploadStatus.progress === 0) {
    props.imgObj!.filename.isTimestampNaming = imageName.autoTimestampNaming

    // 如果开启了自动时间戳命名，则将哈希化和前缀命名关闭
    if (props.imgObj!.filename.isTimestampNaming) {
      props.imgObj!.filename.isAddHash = false
      props.imgObj!.filename.isPrefixNaming = false
      onTimestampNaming(true)
    } else {
      props.imgObj!.filename.isAddHash = imageName.autoAddHash
      props.imgObj!.filename.isPrefixNaming = imageName.prefixNaming.enable
      props.imgObj!.filename.prefixName = imageName.prefixNaming.prefix

      prefixNamingTrans(imageName.prefixNaming.enable, props.imgObj)
      hashRename(imageName.autoAddHash, props.imgObj)
    }

    fileNameOperateData.isTimestampNaming = props.imgObj!.filename.isTimestampNaming
    fileNameOperateData.isHash = props.imgObj!.filename.isAddHash
    fileNameOperateData.isPrefixNaming = props.imgObj!.filename.isPrefixNaming
    fileNameOperateData.isRename = props.imgObj!.filename.isRename
    fileNameOperateData.newName = props.imgObj!.filename.newName
  }
}

watch(
  () => props.imgObj!.uploadStatus,
  (nv) => {
    if (nv.uploading) {
      loadingText.value = instance!.proxy!.$t('upload.loading1')
    }
  },
  {
    deep: true,
    immediate: true
  }
)

onMounted(async () => {
  await initImgSettings(props.imgObj, userSettings)
  initFilename()
})
</script>

<style scoped lang="stylus">
@import "./upload-image-card.styl"
</style>
