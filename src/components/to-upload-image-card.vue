<template>
  <div class="to-upload-image-list-card"
       v-if="toUploadImage.list.length || userConfigInfo.selectedRepos"
  >
    <div class="header">
      <div>
        <selectedInfoBar></selectedInfoBar>
      </div>
      <div>
        <span v-if="toUploadImage.list.length">已上传：{{ toUploadImage.uploadedNumber }} / {{ toUploadImage.list.length }}</span>
      </div>
    </div>
    <div class="body" v-if="toUploadImage.list.length">
      <ul class="image-uploading-info-box">
        <li class="image-uploading-info-item"
            :class="{'disable': loadingAllImage}"
            v-for="(imgItem, index) in toUploadImage.list"
            :key="index"
        >
          <div class="left-image-box flex-center">
            <div class="image-box"
                 @click="imageViewer(imgItem.imgData.base64Url)"
            >
              <img :src="imgItem.imgData.base64Url">
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

            <div class="bottom rename-operation"
                 v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100"
            >
              <el-checkbox label="哈希化"
                           v-model="imgItem.filename.isHashRename"
                           @change="hashRename($event, imgItem)"
              ></el-checkbox>

              <el-checkbox label="重命名"
                           v-model="imgItem.filename.isRename"
                           @change="rename($event, imgItem)"
              ></el-checkbox>

              <el-input class="rename-input"
                        size="mini"
                        v-if="imgItem.filename.isRename"
                        v-model="imgItem.filename.newName"
                        @input="rename($event, imgItem)"
                        clearable
              ></el-input>
            </div>

            <div class="bottom rename-operation"
                 v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100"
            >
              <copyExternalLink :img-obj="imgItem.uploadedImg"/>
            </div>
          </div>

          <div class="upload-status-box"
               :class="{
                 'wait-upload': !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
                 'uploading': imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100,
                 'uploaded': !imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100
               }"
          >
            <i class="el-icon-upload2"
               v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100"
            >
            </i>

            <i class="el-icon-loading"
               v-if="imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress !== 100"
            ></i>

            <i class="el-icon-check"
               v-if="!imgItem.uploadStatus.uploading && imgItem.uploadStatus.progress === 100"
            ></i>
          </div>

          <div class="remove-to-upload-image"
               v-if="imgItem.uploadStatus.progress !== 100 && !imgItem.uploadStatus.uploading"
               @click="removeToUploadImage(imgItem)"
          >
            <el-tooltip effect="dark"
                        content="移除"
                        placement="top"
            >
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
import { getFileSize } from '../common/utils/fileHandleHelper'
import TimeHelper from '../common/utils/timeHelper'
import { UserConfigInfoModel } from '../common/model/userConfigInfo.model'
import { ToUploadImageModel, UploadedImageModel } from '../common/model/upload.model'
import { ElMessage } from 'element-plus'
import axios from '../common/utils/axios'
import uploadUrlHandle from '../common/utils/uploadUrlHandle'
import { useStore } from 'vuex'
import generateExternalLink from '../common/utils/generateExternalLink'
import { UploadStatusEnum } from '../common/model/upload.model'
import { ExternalLinkType } from '../common/model/externalLink.model'
import copyExternalLink from './copy-external-link.vue'
import selectedInfoBar from './selected-info-bar.vue'

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

      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,
      toUploadImage: computed(() => store.getters.getToUploadImage),

      hashRename(e: boolean, img: any) {
        if (e) {
          img.filename.now = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
        } else {
          img.filename.now = `${img.filename.name}.${img.filename.suffix}`
        }
      },

      rename(e: boolean, img: any) {

        if (e) {
          img.filename.name = img.filename.newName
        } else {
          img.filename.name = img.filename.initName
        }

        if (img.filename.isHashRename) {
          img.filename.now = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
        } else {
          img.filename.now = `${img.filename.name}.${img.filename.suffix}`
        }
      },

      getFileSize(size: number) {
        return getFileSize(size)
      },

      formatLastModified(t: number) {
        return TimeHelper.formatTimestamp(t)
      },

      async uploadImage_all(userConfigInfo: UserConfigInfoModel) {

        const uploadIndex = this.toUploadImage.uploadedNumber

        if (uploadIndex >= this.toUploadImage.list.length) return UploadStatusEnum.uploaded
        if (await this.uploadImage_single(userConfigInfo, this.toUploadImage.list[uploadIndex]) === true) {
          if (uploadIndex < this.toUploadImage.list.length) {
            await this.uploadImage_all(userConfigInfo)
            return UploadStatusEnum.allUploaded
          } else {
            return UploadStatusEnum.uploaded
          }
        } else {
          return UploadStatusEnum.uploadFail
        }
      },

      uploadImage_single(userConfigInfo: UserConfigInfoModel, img: ToUploadImageModel): Promise<any> {

        const {
          token,
          selectedBranch,
          email,
          owner
        } = userConfigInfo

        img.uploadStatus.uploading = true

        const data: any = {
          'message': 'Upload pictures via PicX(https://github.com/XPoet/picx)',
          'branch': selectedBranch,
          'content': img.imgData.base64Content
        }

        if (email) {
          data.committer = {
            name: owner,
            email: email,
          }
        }

        return new Promise((resolve, reject) => {
          axios.put(
            uploadUrlHandle(userConfigInfo, img.filename.now),
            data,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${token}`
              }
            }
          ).then(res => {
            if (res && res.status === 201) {
              this.uploadedHandle(res, img, userConfigInfo)
              store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
              resolve(true)

              ElMessage.success('上传成功！')
            } else {
              img.uploadStatus.uploading = false
              resolve(false)

              ElMessage.error('上传失败！')
            }
          }).catch(error => {
            reject(error)
          })
        })
      },

      uploadedHandle(
        res: any,
        img: ToUploadImageModel,
        userConfigInfo: UserConfigInfoModel
      ) {
        // 上传状态处理
        img.uploadStatus.progress = 100
        img.uploadStatus.uploading = false

        // 生成外链
        img.externalLink.github = generateExternalLink(ExternalLinkType.gh, res.data.content, userConfigInfo)
        img.externalLink.cdn = generateExternalLink(ExternalLinkType.cdn, res.data.content, userConfigInfo)
        img.externalLink.markdown_gh = generateExternalLink(ExternalLinkType.md_gh, res.data.content, userConfigInfo)
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

@import "../style.styl"

$info-item-height = 68px
$info-item-border = 1px
$info-item-padding = 5px
$file-info-background-color = #f1f1f1
$image-width = $info-item-height - ($info-item-border * 2)

.to-upload-image-list-card {
  position relative
  width 100%
  box-sizing border-box

  .header {
    width 100%
    height 30px
    box-sizing border-box
    font-size 12px
    display flex
    align-items center
    justify-content space-between
    padding-bottom 6px
  }

  .body {
    width 100%
    height 100%
    max-height 170px
    overflow-y auto
    box-sizing border-box
    padding 10px
    border 1px solid $image-list-border-color

    &::-webkit-scrollbar {
      width 5px
    }

    &::-webkit-scrollbar-thumb {
      border-radius 2px
    }

    .image-uploading-info-box {
      position relative
      width 100%
      box-sizing border-box
      padding 0
      margin 0

      .image-uploading-info-item {
        position relative
        box-sizing border-box
        width 100%
        height $info-item-height
        border $info-item-border solid $image-list-border-color
        border-radius 5px
        margin-bottom 10px
        overflow hidden
        font-size 15px
        padding-left $image-width
        transition all 0.3s ease

        &.disable {
          pointer-events none
          cursor not-allowed
        }

        &:last-child {
          margin-bottom 0
        }

        &:hover {
          box-shadow 0 0 5px #ddd
        }

        .left-image-box {
          position absolute
          top 0
          left 0
          width $image-width
          height 100%
          box-sizing border-box
          margin-right 5px
          padding $info-item-padding

          .image-box {
            width 100%
            height 100%
            border 1px solid $image-list-border-color
            border-radius 5px
            box-sizing border-box
            overflow hidden
            cursor pointer
          }

          img {
            object-fit: cover;
            width: 100%;
            height: 100%;
          }
        }


        .right-operation-box {
          position relative
          width 100%
          height 100%
          box-sizing border-box
          padding $info-item-padding 22px $info-item-padding $info-item-padding

          .top, .bottom {
            width 100%
            height 50%
            box-sizing border-box
            padding 0 5px
          }

          .top {
            display flex
            justify-content space-between

            .image-name,
            .image-info {
              display flex
              align-items center
              box-sizing border-box
              height 100%
            }

            .image-name {
              font-size 13px
              width 55%
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .image-info {
              font-size 12px
              width 45%

              .item {
                padding 1px 4px
                background $file-info-background-color
                border-radius 2px
                margin-left 10px
              }
            }
          }


          .bottom {
            display flex
            align-items center

            &.rename-operation {

              .el-checkbox {
                margin-right: 20px;
              }

              .rename-input {
                input {
                  height 23px
                  line-height 23px
                }
              }
            }
          }
        }


        .upload-status-box {
          box-sizing border-box
          color: #fff;
          position: absolute;
          right: -17px;
          top: -7px;
          width: 46px;
          height: 26px;
          text-align: center;
          transform: rotate(45deg);
          box-shadow: 0 1px 1px $image-list-border-color;

          &.wait-upload {
            background: #E6A23C;
          }

          &.uploading {
            background: #409EFF;
          }

          &.uploaded {
            background: #67C23A;
          }

          i {
            font-size: 12px;
            margin-top: 12px;
            transform: rotate(-45deg);
          }
        }


        .remove-to-upload-image {
          position absolute
          bottom 5px
          right 5px
          cursor pointer
        }

      }
    }

  }
}


</style>
