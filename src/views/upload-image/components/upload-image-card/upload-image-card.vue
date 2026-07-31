<script setup lang="ts">
import type { UploadImageModel } from '@/common/model'
import { computed, getCurrentInstance, onMounted, reactive, ref, watch } from 'vue'
import { RENAME_MAX_LENGTH } from '@/common/constant'
import { useStore } from '@/stores'
import { copyImageLink } from '@/utils'
import { formatDatetime } from '@/utils/common-utils'
import { getFileSize } from '@/utils/file-utils'
import { addHashHandle, addPrefixHandle, initImgSettings, rename } from './upload-image-card.util'

const props = defineProps({
  imgObj: {
    type: Object as () => UploadImageModel,
    require: true,
    default: () => ({}),
  },
})
const emits = defineEmits(['remove'])
const store = useStore()
const instance = getCurrentInstance()

const userSettings = computed(() => store.getters.getUserSettings).value

const renameInputRef = ref<any>(null)
const loadingText = ref('')

const fileNameOperateData = reactive({
  isAddHash: false,
  isAddPrefix: false,
  isRename: false,
  newName: '',
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

const onHashRename = (value: string | number | boolean) => {
  addHashHandle(value === true, props.imgObj)
}

const onPrefixNaming = (value: string | number | boolean) => {
  addPrefixHandle(value === true, props.imgObj)
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
    immediate: true,
  },
)

onMounted(async () => {
  await initImgSettings(props.imgObj, userSettings)
  initFilename()
})
</script>

<template>
  <div
    class="upload-image-card-container"
    :class="{
      'wait-upload': !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 0,
      'uploading': imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress !== 100,
      'uploaded': !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 100,
    }"
  >
    <div
      v-loading="
        imgObj.uploadStatus.uploading
          || imgObj.beforeUploadStatus.compressing
          || imgObj.beforeUploadStatus.watermarking
      "
      class="img-show-container"
      :element-loading-text="loadingText"
    >
      <el-image
        :src="
          imgObj.base64.compressBase64
            || imgObj.base64.watermarkBase64
            || imgObj.base64.originalBase64
        "
        fit="cover"
        loading="lazy"
        :hide-on-click-modal="true"
        :preview-src-list="[
          imgObj.base64.compressBase64
            || imgObj.base64.watermarkBase64
            || imgObj.base64.originalBase64,
        ]"
      />
    </div>

    <div class="before-upload-handle-container">
      <div class="img-name-box" :class="{ 'no-border': imgObj.uploadStatus.progress === 100 }">
        <span class="img-name text-ellipsis">
          {{ imgObj.filename.final || imgObj.filename.name }}
        </span>
        <el-tooltip
          v-if="imgObj.uploadStatus.progress === 0"
          placement="top"
          :offset="8"
          :content="imgNameOperateFolded ? $t('upload_page.expand') : $t('upload_page.fold')"
        >
          <el-icon class="fold-btn" @click="imgNameOperateFolded = !imgNameOperateFolded">
            <IEpCaretBottom v-if="!imgNameOperateFolded" />
            <IEpCaretLeft v-if="imgNameOperateFolded" />
          </el-icon>
        </el-tooltip>
      </div>
      <div
        v-if="imgObj.uploadStatus.progress === 0"
        class="img-name-operate-box"
        :class="{ folded: imgNameOperateFolded }"
      >
        <!-- 哈希化 -->
        <div class="operate-item">
          <el-checkbox
            v-model="fileNameOperateData.isAddHash"
            :label="$t('upload_page.add_hash')"
            @change="onHashRename($event)"
          />
        </div>

        <!-- 重命名 -->
        <div class="operate-item">
          <el-checkbox
            v-model="fileNameOperateData.isRename"
            :label="$t('rename')"
            @change="onRename"
          />
          <el-input
            v-if="imgObj.filename.isRename"
            ref="renameInputRef"
            v-model="fileNameOperateData.newName"
            class="rename-input"
            size="small"
            :maxlength="RENAME_MAX_LENGTH"
            clearable
            @input="onRename"
          />
        </div>

        <!-- 添加前缀 -->
        <div
          v-if="
            !imgObj.filename.isRename
              && userSettings.imageName.addPrefix.enable
              && userSettings.imageName.addPrefix.prefix
          "
          class="operate-item"
        >
          <el-checkbox
            v-model="fileNameOperateData.isAddPrefix"
            :label="$t('upload_page.add_prefix')"
            @change="onPrefixNaming($event)"
          />
        </div>
      </div>
      <div v-if="imgObj.uploadStatus.progress === 0" class="img-info-box">
        <div class="file-size-box">
          <span
            class="original-file-size file-size-item"
            :class="{ 'del-line': imgObj.fileInfo?.compressFile?.size }"
          >
            {{ getFileSize(imgObj.fileInfo.originalFile?.size ?? 0) }} KB
          </span>
          <span v-if="imgObj.fileInfo?.compressFile?.size" class="finial-file-size file-size-item">
            {{ getFileSize(imgObj.fileInfo?.compressFile?.size) }} KB
          </span>
        </div>
        <span class="last-modified">
          {{
            imgObj.fileInfo.originalFile
              ? formatDatetime('yyyy-MM-dd hh:mm', imgObj.fileInfo.originalFile.lastModified)
              : ''
          }}
        </span>
      </div>
    </div>

    <div
      v-if="imgObj.uploadStatus.progress === 100"
      class="after-upload-handle-container flex-center"
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
      <el-icon class="del-img-btn" @click="remove(imgObj.uuid)">
        <IEpRemove />
      </el-icon>
    </el-tooltip>

    <div
      class="upload-status-box"
      :class="{
        'wait-upload': !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 0,
        'uploaded': !imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 100,
      }"
    >
      <el-icon>
        <IEpUpload v-if="!imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 0" />
        <IEpCheck v-if="!imgObj.uploadStatus.uploading && imgObj.uploadStatus.progress === 100" />
      </el-icon>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "./upload-image-card.styl"
</style>
