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
          :content="imgNameOperateFolded ? $t('upload_page.expand') : $t('upload_page.fold')"
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
            v-if="imgObj.filename.isRename"
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
            !imgObj.filename.isRename &&
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
      @click="copyImageLink(imgObj.uploadedImg!)"
    >
      {{ $t('copy_link') }}
    </div>

    <el-tooltip
      v-if="imgObj.uploadStatus.progress === 0"
      placement="top"
      :offset="8"
      :content="$t('delete')"
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
import { addHashHandle, initImgSettings, addPrefixHandle, rename } from './upload-image-card.util'
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

const emits = defineEmits(['remove'])
const userSettings = computed(() => store.getters.getUserSettings).value

const renameInputRef = ref<any>(null)
const loadingText = ref('')

const fileNameOperateData = reactive({
  isAddHash: false,
  isAddPrefix: false,
  isRename: false,
  newName: ''
})

const imgNameOperateFolded = ref<boolean>(true)

const remove = (uuid: string) => {
  emits('remove', uuid)
}

const onRename = () => {
  props.imgObj!.filename.newName = fileNameOperateData.newName
  setTimeout(() => {
    renameInputRef.value?.focus()
  }, 100)
  rename(fileNameOperateData.isRename, props.imgObj)
}

const onHashRename = (e: boolean) => {
  addHashHandle(e, props.imgObj)
}

const onPrefixNaming = (e: boolean) => {
  addPrefixHandle(e, props.imgObj)
}

const initFilename = () => {
  const { imageName } = userSettings
  if (props.imgObj!.uploadStatus.progress === 0) {
    props.imgObj!.filename.isAddHash = imageName.enableHash
    props.imgObj!.filename.isAddPrefix = imageName.addPrefix.enable
    props.imgObj!.filename.prefix = imageName.addPrefix.prefix

    // 添加前缀处理
    addPrefixHandle(imageName.addPrefix.enable, props.imgObj)

    // 添加哈希值处理
    addHashHandle(imageName.enableHash, props.imgObj)

    fileNameOperateData.isAddHash = props.imgObj!.filename.isAddHash
    fileNameOperateData.isAddPrefix = props.imgObj!.filename.isAddPrefix
    fileNameOperateData.isRename = props.imgObj!.filename.isRename
    fileNameOperateData.newName = props.imgObj!.filename.newName
  }
}

watch(
  () => props.imgObj!.uploadStatus,
  (nv) => {
    if (nv.uploading) {
      loadingText.value = instance!.proxy!.$t('upload_page.uploading')
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
