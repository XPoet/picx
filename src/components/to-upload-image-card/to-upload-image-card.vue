<template>
  <div
    class="to-upload-image-list-card"
    v-if="toUploadImage.list.length || userConfigInfo.selectedRepos"
  >
    <div class="header">
      <div>
        <selected-info-bar />
      </div>
      <div>
        <span v-if="toUploadImage.list.length">
          已上传：{{ toUploadImage.uploadedNumber }} / {{ toUploadImage.list.length }}
        </span>
      </div>
    </div>

    <div class="body" v-if="toUploadImage.list.length">
      <ul class="image-uploading-info-box">
        <li
          class="image-uploading-info-item"
          :class="{ disable: loadingAllImage }"
          v-for="(imgItem, index) in toUploadImage.list"
          :key="index"
        >
          <div class="left-image-box">
            <img data-fancybox="gallery" :src="imgItem.imgData.base64Url" />
          </div>

          <div class="right-operation-box">
            <div class="top">
              <div class="image-name">
                {{ imgItem.filename.now }}
              </div>
              <div class="image-info">
                <span class="file-size item" v-if="userSettings.isCompress">
                  <del>
                    {{ getFileSize(imgItem.fileInfo.originSize) }}
                  </del>
                </span>

                <span
                  class="file-size item"
                  :class="{ compressed: userSettings.isCompress }"
                >
                  {{ getFileSize(imgItem.fileInfo.size) }}
                </span>

                <span class="last-modified item">
                  {{ formatLastModified(imgItem.fileInfo.lastModified) }}
                </span>
              </div>
            </div>

            <div
              class="bottom rename-operation"
              v-if="
                !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100
              "
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
                  userConfigInfo.defaultPrefix &&
                  userConfigInfo.prefixName
                "
                v-model="imgItem.filename.isPrefix"
                @change="prefixName($event, imgItem)"
              ></el-checkbox>
            </div>

            <div
              class="bottom rename-operation"
              v-if="
                !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100
              "
            >
              <copy-externalLink :img-obj="imgItem.uploadedImg" />
            </div>
          </div>

          <div
            class="upload-status-box"
            :class="{
              'wait-upload':
                !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
              uploading:
                imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
              uploaded:
                !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100
            }"
          >
            <el-icon
              v-if="
                !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100
              "
              ><Upload
            /></el-icon>

            <el-icon
              class="is-loading"
              v-if="
                imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100
              "
              ><Loading
            /></el-icon>

            <el-icon
              v-if="
                !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100
              "
              ><Check
            /></el-icon>
          </div>

          <div
            class="remove-to-upload-image"
            v-if="
              imgItem.uploadStatus.progress !== 100 && !imgItem.uploadStatus.uploading
            "
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

<script lang="ts">
import { computed, defineComponent, reactive, toRefs, onMounted } from 'vue'
import { useStore } from '@/store'
import { getFileSize } from '@/utils/file-handle-helper'
import { UserConfigInfoModel } from '@/common/model/user-config-info.model'
import { ToUploadImageModel, UploadStatusEnum } from '@/common/model/upload.model'
import TimeHelper from '@/utils/time-helper'
import copyExternalLink from '@/components/copy-external-link/copy-external-link.vue'
import selectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'
import { uploadImage_single } from '@/utils/upload-helper'

export default defineComponent({
  name: 'to-upload-image-card',

  components: {
    copyExternalLink,
    selectedInfoBar
  },

  props: {
    loadingAllImage: {
      type: Boolean,
      default: false
    }
  },

  setup() {
    const store = useStore()

    const reactiveData = reactive({
      isShowDialog: false,
      curImgInfo: {
        size: ''
      },

      userConfigInfo: computed(() => store.getters.getUserConfigInfo).value,
      userSettings: computed(() => store.getters.getUserSettings).value,
      toUploadImage: computed(() => store.getters.getToUploadImage).value,

      hashRename(e: boolean, img: any) {
        if (e) {
          // eslint-disable-next-line no-param-reassign
          img.filename.now = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
        } else {
          // eslint-disable-next-line no-param-reassign
          img.filename.now = `${img.filename.name}.${img.filename.suffix}`
        }
      },

      prefixName(e: boolean, img: any) {
        if (e) {
          // eslint-disable-next-line no-param-reassign
          img.filename.name = `${img.filename.prefixName}${img.filename.initName}`
        } else {
          // eslint-disable-next-line no-param-reassign
          img.filename.name = `${img.filename.initName}`
        }
        if (img.filename.isHashRename) {
          // eslint-disable-next-line no-param-reassign
          img.filename.now = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
        } else {
          // eslint-disable-next-line no-param-reassign
          img.filename.now = `${img.filename.name}.${img.filename.suffix}`
        }
      },

      rename(e: boolean, img: any) {
        if (e) {
          // eslint-disable-next-line no-param-reassign
          img.filename.name = img.filename.newName.trim().replace(/\s+/g, '-')
        } else {
          // eslint-disable-next-line no-param-reassign
          reactiveData.prefixName(img.filename.isPrefix, img) // 恢复列表prefix选项
        }

        if (img.filename.isHashRename) {
          // eslint-disable-next-line no-param-reassign
          img.filename.now = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
        } else {
          // eslint-disable-next-line no-param-reassign
          img.filename.now = `${img.filename.name}.${img.filename.suffix}`
        }
      },

      getFileSize(size: number) {
        return `${getFileSize(size)} KB`
      },

      formatLastModified(t: number) {
        return TimeHelper.formatTimestamp(t)
      },

      async uploadImage_all(userConfigInfo: UserConfigInfoModel) {
        const uploadIndex = this.toUploadImage.uploadedNumber

        if (uploadIndex >= this.toUploadImage.list.length) {
          return UploadStatusEnum.uploaded
        }

        if (
          await uploadImage_single(userConfigInfo, this.toUploadImage.list[uploadIndex])
        ) {
          if (uploadIndex < this.toUploadImage.list.length) {
            await this.uploadImage_all(userConfigInfo)
            return UploadStatusEnum.allUploaded
          }
          return UploadStatusEnum.uploaded
        }
        return UploadStatusEnum.uploadFail
      }
    })

    const removeToUploadImage = (imgItem: ToUploadImageModel) => {
      store.dispatch('TO_UPLOAD_IMAGE_LIST_REMOVE', imgItem.uuid)
    }

    onMounted(() => {
      const {
        defaultHash: isHash,
        defaultPrefix: isPrefix,
        prefixName
      } = reactiveData.userSettings
      reactiveData.toUploadImage.list.forEach((v: ToUploadImageModel) => {
        // eslint-disable-next-line no-param-reassign
        v.filename.isPrefix = isPrefix
        // eslint-disable-next-line no-param-reassign
        v.filename.prefixName = prefixName
        reactiveData.prefixName(isPrefix, v)
        // eslint-disable-next-line no-param-reassign
        v.filename.isHashRename = isHash
        reactiveData.hashRename(isHash, v)
      })
    })

    return {
      ...toRefs(reactiveData),
      removeToUploadImage
    }
  }
})
</script>

<style lang="stylus">
@import "to-upload-image-card.styl"
</style>
