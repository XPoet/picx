<template>
  <div
    class="to-upload-image-list-card"
    v-if="toUploadImages.list.length || userConfigInfo.selectedRepo"
  >
    <div class="header">
      <div>
        <selected-info-bar />
      </div>
      <div>
        <span v-if="toUploadImages.list.length">
          已上传：{{ toUploadImages.uploadedNumber }} / {{ toUploadImages.list.length }}
        </span>
      </div>
    </div>

    <div
      class="body"
      :class="{ 'no-border': toUploadImages.list.length === 1 }"
      v-if="toUploadImages.list.length"
    >
      <ul class="image-uploading-info-box">
        <li
          class="image-uploading-info-item"
          :class="{ disable: loadingAllImage }"
          v-for="(imgItem, index) in toUploadImages.list"
          :key="index"
        >
          <div class="left-image-box">
            <img data-fancybox="gallery" :src="imgItem.imgData.base64Url" />
          </div>

          <div class="right-operation-box">
            <div class="top">
              <div class="image-name">
                {{ imgItem.filename.final }}
              </div>
              <div class="image-info">
                <span class="file-size original-file-size item" v-if="userSettings.isCompress">
                  <del> {{ getFileSize(imgItem.fileInfo.originSize) }}KB </del>
                </span>

                <span class="file-size item" :class="{ compressed: userSettings.isCompress }">
                  {{ getFileSize(imgItem.fileInfo.size) }} KB
                </span>

                <span class="last-modified item">
                  {{ formatDatetime('yyyy-MM-dd hh:mm', imgItem.fileInfo.lastModified) }}
                </span>
              </div>
            </div>

            <div
              class="bottom rename-operation"
              v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100"
            >
              <!-- 哈希化 -->
              <el-checkbox
                label="哈希化"
                v-model="imgItem.filename.isHashRename"
                @change="hashRename($event, imgItem)"
              ></el-checkbox>

              <!-- 重命名 -->
              <el-checkbox
                label="重命名"
                v-model="imgItem.filename.isRename"
                @change="rename($event, imgItem)"
              ></el-checkbox>
              <el-input
                class="rename-input"
                size="small"
                v-if="imgItem.filename.isRename"
                v-model="imgItem.filename.newName"
                @input="rename($event, imgItem)"
                clearable
              ></el-input>

              <!-- 命名前缀 -->
              <el-checkbox
                label="命名前缀"
                v-if="
                  !imgItem.filename.isRename &&
                  userSettings.defaultPrefix &&
                  userSettings.prefixName
                "
                v-model="imgItem.filename.isPrefix"
                @change="prefixName($event, imgItem)"
              ></el-checkbox>
            </div>

            <div
              class="bottom rename-operation"
              v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100"
            >
              <copy-image-link :img-obj="imgItem.uploadedImg" />
            </div>
          </div>

          <div
            class="upload-status-box"
            :class="{
              'wait-upload':
                !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
              uploading: imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
              uploaded: !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100
            }"
          >
            <el-icon v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100"
              ><Upload
            /></el-icon>

            <el-icon
              class="is-loading"
              v-if="imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100"
              ><Loading
            /></el-icon>

            <el-icon v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100"
              ><Check
            /></el-icon>
          </div>

          <div
            class="remove-to-upload-image"
            v-if="imgItem.uploadStatus.progress !== 100 && !imgItem.uploadStatus.uploading"
            @click="removeToUploadImage(imgItem)"
          >
            <el-tooltip effect="dark" content="移除" placement="top">
              <el-icon><Delete /></el-icon>
            </el-tooltip>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStore } from '@/store'
import { formatDatetime, getFileSize } from '@/utils'
import { UserConfigInfoModel, ToUploadImageModel, UploadStatusEnum } from '@/common/model'
import CopyImageLink from '@/components/copy-image-link/copy-image-link.vue'
import SelectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'
import { uploadImageToGitHub, uploadImagesToGitHub } from '@/utils/upload-utils'

defineProps({
  loadingAllImage: {
    type: Boolean,
    default: false
  }
})

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value
const toUploadImages = computed(() => store.getters.getToUploadImages).value

const hashRename = (e: boolean, img: any) => {
  if (e) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}

const prefixNaming = (e: boolean, img: any) => {
  if (e) {
    img.filename.name = `${img.filename.prefixName}${img.filename.initName}`
  } else {
    img.filename.name = `${img.filename.initName}`
  }
  if (img.filename.isHashRename) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}

const rename = (e: boolean, img: any) => {
  if (e) {
    img.filename.name = img.filename.newName.trim().replace(/\s+/g, '-')
  } else {
    prefixNaming(img.filename.isPrefix, img) // 恢复列表 prefix 选项
  }

  if (img.filename.isHashRename) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}

const goUploadImages = async (userConfigInfo: UserConfigInfoModel) => {
  // 单张图片
  if (toUploadImages.list.length === 1) {
    if (await uploadImageToGitHub(userConfigInfo, toUploadImages.list[0])) {
      return UploadStatusEnum.uploaded
    }
    return UploadStatusEnum.uploadFail
  }
  // 多张图片
  if (await uploadImagesToGitHub(userConfigInfo, toUploadImages.list)) {
    return UploadStatusEnum.allUploaded
  }
  return UploadStatusEnum.uploadFail
}

const removeToUploadImage = (imgItem: ToUploadImageModel) => {
  store.dispatch('TO_UPLOAD_IMAGE_LIST_REMOVE', imgItem.uuid)
}

onMounted(() => {
  const { defaultHash: isHash, defaultPrefix: isPrefix, prefixName } = userSettings
  toUploadImages.list.forEach((v: ToUploadImageModel) => {
    v.filename.isPrefix = isPrefix
    v.filename.prefixName = prefixName
    prefixNaming(isPrefix, v)
    v.filename.isHashRename = isHash
    hashRename(isHash, v)
  })
})

defineExpose({ goUploadImages })
</script>

<style lang="stylus">
@import "to-upload-image-card.styl"
</style>
