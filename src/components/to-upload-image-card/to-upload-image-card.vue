<template>
  <div class="to-upload-image-list-card" v-if="toUploadImage.list.length || userConfigInfo.selectedRepos">
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
          <div class="left-image-box flex-center">
            <div class="image-box" @click="imageViewer(imgItem.imgData.base64Url)">
              <img :src="imgItem.imgData.base64Url" />
            </div>
          </div>

          <div class="right-operation-box">
            <div class="top">
              <div class="image-name">
                {{ imgItem.filename.now }}
              </div>

              <div class="image-info">
                <span class="file-size item">
                  {{ getFileSize(imgItem.fileInfo.size) }}
                </span>
                <span class="last-modified item">
                  {{ formatLastModified(imgItem.fileInfo.lastModified) }}
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
                size="mini"
                v-if="imgItem.filename.isRename"
                v-model="imgItem.filename.newName"
                @input="rename($event, imgItem)"
                clearable
              ></el-input>
            </div>

            <div
              class="bottom rename-operation"
              v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100"
            >
              <copy-externalLink :img-obj="imgItem.uploadedImg" />
            </div>
          </div>

          <div
            class="upload-status-box"
            :class="{
              'wait-upload': !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
              uploading: imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
              uploaded: !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100
            }"
          >
            <i class="el-icon-upload2" v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100">
            </i>

            <i
              class="el-icon-loading"
              v-if="imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100"
            ></i>

            <i
              class="el-icon-check"
              v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100"
            ></i>
          </div>

          <div
            class="remove-to-upload-image"
            v-if="imgItem.uploadStatus.progress !== 100 && !imgItem.uploadStatus.uploading"
            @click="removeToUploadImage(imgItem)"
          >
            <el-tooltip effect="dark" content="移除" placement="top">
              <i class="el-icon-delete"></i>
            </el-tooltip>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from '@/store'
import { getFileSize } from '@/common/utils/fileHandleHelper'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import { ToUploadImageModel, UploadedImageModel, UploadStatusEnum } from '@/common/model/upload.model'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import TimeHelper from '@/common/utils/timeHelper'
import axios from '@/common/utils/axios'
import uploadUrlHandle from '@/common/utils/uploadUrlHandle'
import generateExternalLink from '@/common/utils/generateExternalLink'
import copyExternalLink from '@/components/copy-external-link/copy-external-link.vue'
import selectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'

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
      curImgInfo: null,

      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,
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

      rename(e: boolean, img: any) {
        if (e) {
          // eslint-disable-next-line no-param-reassign
          img.filename.name = img.filename.newName
        } else {
          // eslint-disable-next-line no-param-reassign
          img.filename.name = img.filename.initName
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

        if (uploadIndex >= this.toUploadImage.list.length) return UploadStatusEnum.uploaded
        if ((await this.uploadImage_single(userConfigInfo, this.toUploadImage.list[uploadIndex])) === true) {
          if (uploadIndex < this.toUploadImage.list.length) {
            await this.uploadImage_all(userConfigInfo)
            return UploadStatusEnum.allUploaded
          }
          return UploadStatusEnum.uploaded
        }
        return UploadStatusEnum.uploadFail
      },

      uploadImage_single(userConfigInfo: UserConfigInfoModel, img: ToUploadImageModel): Promise<any> {
        const { token, selectedBranch, email, owner } = userConfigInfo

        // eslint-disable-next-line no-param-reassign
        img.uploadStatus.uploading = true

        const data: any = {
          message: 'Upload pictures via PicX(https://github.com/XPoet/picx)',
          branch: selectedBranch,
          content: img.imgData.base64Content
        }

        if (email) {
          data.committer = {
            name: owner,
            email
          }
        }

        return new Promise((resolve, reject) => {
          axios
            .put(uploadUrlHandle(userConfigInfo, img.filename.now), data, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `token ${token}`
              }
            })
            .then((res) => {
              if (res && res.status === 201) {
                this.uploadedHandle(res, img, userConfigInfo)
                store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
                resolve(true)

                ElMessage.success('上传成功！')
              } else {
                // eslint-disable-next-line no-param-reassign
                img.uploadStatus.uploading = false
                resolve(false)

                ElMessage.error('上传失败！')
              }
            })
            .catch((error) => {
              reject(error)
            })
        })
      },

      uploadedHandle(res: any, img: ToUploadImageModel, userConfigInfo: UserConfigInfoModel) {
        // 上传状态处理
        // eslint-disable-next-line no-param-reassign
        img.uploadStatus.progress = 100
        // eslint-disable-next-line no-param-reassign
        img.uploadStatus.uploading = false

        // 生成外链
        // eslint-disable-next-line no-param-reassign
        img.externalLink.github = generateExternalLink(ExternalLinkType.gh, res.data.content, userConfigInfo)
        // eslint-disable-next-line no-param-reassign
        img.externalLink.cdn = generateExternalLink(ExternalLinkType.cdn, res.data.content, userConfigInfo)
        // eslint-disable-next-line no-param-reassign
        img.externalLink.markdown_gh = generateExternalLink(ExternalLinkType.md_gh, res.data.content, userConfigInfo)
        // eslint-disable-next-line no-param-reassign
        img.externalLink.markdown_cdn = generateExternalLink(ExternalLinkType.md_cdn, res.data.content, userConfigInfo)

        const item: UploadedImageModel = {
          uuid: img.uuid,
          dir: userConfigInfo.selectedDir,
          name: res.data.content.name,
          path: res.data.content.path,
          sha: res.data.content.sha,
          github_url: img.externalLink.github,
          cdn_url: img.externalLink.cdn,
          md_gh_url: img.externalLink.markdown_gh,
          md_cdn_url: img.externalLink.markdown_cdn,
          is_transform_md: false,
          deleting: false
        }

        // eslint-disable-next-line no-param-reassign
        img.uploadedImg = item

        // 如果 userConfigInfo.dirList 不存在该目录，则增加
        if (!userConfigInfo.dirList.some((v: any) => v.value === item.dir)) {
          // userConfigInfo 增加目录
          store.dispatch('USER_CONFIG_INFO_ADD_DIR', item.dir)

          // dirImageList 增加目录
          store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.dir)
        }

        // uploadedList 增加图片
        store.dispatch('UPLOADED_LIST_ADD', item)

        // dirImageList 增加图片
        store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item)
      },

      imageViewer(base64Url: string) {
        store.commit('IMAGE_VIEWER', {
          isShow: true,
          url: base64Url
        })
      }
    })

    const removeToUploadImage = (imgItem: ToUploadImageModel) => {
      store.dispatch('TO_UPLOAD_IMAGE_LIST_REMOVE', imgItem.uuid)
    }

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
