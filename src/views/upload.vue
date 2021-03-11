<template>
  <div class="upload-page-container">
    <div class="upload-page-left page-container"
         v-if="uploadedImageList.length"
         :style="{
            'width': '30%'
         }"
    >
      <div class="uploaded-item"
           v-for="item in uploadedImageList"
      >
        <ImageCard :image-obj="item"
                   :is-uploaded="true"
        />
      </div>

    </div>

    <div class="upload-page-right page-container"
         :style="{
            'width': uploadedImageList.length ? '70%' : '100%'
         }"
    >

      <!-- 上传区域 -->
      <div class="row-item">
        <div class="content-box">
          <div class="upload-area active-upload"
               :class="{'focus': uploadAreaActive}"
               @dragover.prevent
               @drop.stop.prevent="onDrop"
               @paste="onPaste"
               v-loading="uploadStatus.uploading && uploadStatus.progress !== 100"
               element-loading-text="上传中..."
               element-loading-background="rgba(0, 0, 0, 0.5)"
          >
            <label for="uploader"
                   class="active-upload"
                   v-if="uploadAreaActive"
            ></label>
            <input id="uploader"
                   type="file"
                   @change="onFileChange"
            >
            <div class="tips active-upload" v-if="!imgData.base64Url">
              <i class="icon el-icon-upload active-upload"></i>
              <div class="text active-upload">拖拽、粘贴、或点击此处上传</div>
            </div>
            <img class="active-upload"
                 v-if="imgData.base64Url"
                 :src="imgData.base64Url"
                 alt="Pictures to be uploaded"
            >
          </div>
        </div>

      </div>


      <!-- 上传状态 -->
      <div class="row-item"
           v-if="imgData.base64Url"
      >
        <div class="content-box">
          <div class="upload-status">

            <div class="file-status">

              <div class="filename"
              >{{ filename.now }}
              </div>

              <div class="upload-tips wait-upload"
                   v-if="!uploadStatus.uploading && uploadStatus.progress !== 100"
              >
                等待上传 <i class="el-icon-upload2"></i>
              </div>

              <div class="upload-tips uploading"
                   v-if="uploadStatus.uploading && uploadStatus.progress !== 100"
              >
                正在上传 <i class="el-icon-loading"></i>
              </div>

              <div class="upload-tips uploaded"
                   v-if="!uploadStatus.uploading && uploadStatus.progress === 100"
              >
                上传完成 <i class="el-icon-circle-check"></i>
              </div>
            </div>

            <div class="file-size info-item">
              图片大小：{{ getFileSize(fileInfo.size) }}
            </div>

            <div class="file-last-modified info-item">
              最后修改：{{ formatLastModified(fileInfo.lastModified) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 外链 -->
      <div class="row-item"
           v-if="uploadStatus.progress === 100"
      >
        <div class="content-box">
          <div class="external-link">
            <el-input class="external-link-input"
                      size="mini"
                      v-model="externalLink.input_github"
                      ref="GitHubExternalLinkInput"
                      readonly
            >
              <template #append>
                <el-button @click="copyLink('GitHub')">复制GitHub外链</el-button>
              </template>
            </el-input>
            <el-input class="external-link-input"
                      size="mini"
                      v-model="externalLink.input_cdn"
                      ref="CDNExternalLinkInput"
                      readonly
            >
              <template #append>
                <el-button @click="copyLink('CDN')">复制CDN外链
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>

      <!-- 上传操作 -->
      <div class="row-item">
        <div class="content-box">
          <div class="upload-tools">
            <div class="repos-dir-info" v-if="userConfigInfo.selectedRepos">
            <span class="repos-dir-info-item">
               仓库：<el-tag size="small">{{ userConfigInfo.selectedRepos }}</el-tag>
            </span>
              <span class="repos-dir-info-item"
                    v-if="userConfigInfo.selectedBranch"
              >
               分支：<el-tag size="small">{{ userConfigInfo.selectedBranch }}</el-tag>
            </span>
              <span class="repos-dir-info-item"
                    v-if="userConfigInfo.selectedDir"
              >
               目录：<el-tag size="small">{{ userConfigInfo.selectedDir }}</el-tag>
            </span>
            </div>

            <UploadTools
              @is-set-max-size="onSetMaxSizeChane"
              @max-size="onMaxSizeChange"
              @rename="rename"
              @hash-named="hashRename"
              @upload-reset="resetUploadInfo"
              @upload-file="uploadImage"
              @transform-markdown="transformMarkdown"
              :is-show-rename="imgData.base64Url !== '' && uploadStatus.progress !== 100"
              :is-show-hash-name="imgData.base64Url !== '' && uploadStatus.progress !== 100"
              :is-show-transform-markdown="!uploadStatus.uploading && uploadStatus.progress === 100"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, toRefs, watch, ref, Ref } from 'vue'
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from '../common/utils/axios/index'
import TimeHelper from '../common/utils/timeHelper'
import chooseImg from '../common/utils/chooseImg'
import paste from "../common/utils/paste"
import { filenameHandle, getFileSize } from '../common/utils/fileHandleHelper'
import uploadUrlHandle from '../common/utils/uploadUrlHandle'
import generateExternalLink from '../common/utils/generateExternalLink'
import cleanObject from '../common/utils/cleanObject'
import getUuid from '../common/utils/getUuid'
import { ElMessage } from 'element-plus'
import { UserConfigInfoModel } from '../common/model/model'
import UploadTools from '@/components/upload-tools.vue'
import ImageCard from '@/components/image-card.vue'


export default defineComponent({
  name: 'Upload',

  components: {
    ImageCard,
    UploadTools,
  },

  setup() {
    const router = useRouter()
    const store = useStore()

    const GitHubExternalLinkInput: Ref<any> = ref<null | HTMLElement>(null)
    const CDNExternalLinkInput: Ref<any> = ref<null | HTMLElement>(null)

    const reactiveData = reactive({

      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,
      logoutStatus: computed(() => store.getters.getUserLoggingStatus),
      uploadedImageList: computed(() => store.getters.getUploadedImageList),
      uploadAreaActive: computed(() => store.getters.getUploadAreaActive),

      // 图片压缩大小
      compressSize: 200,

      imgData: {
        base64Content: '',
        base64Url: '',
      },

      filename: {
        initName: '',
        prev: '',
        now: '',
        name: '',
        hash: '',
        suffix: '',
      },

      fileInfo: {
        size: 0,
        lastModified: 0
      },

      setMaxSize: false,

      // 哈希重命名
      isHashRename: false,

      // 重命名
      isRename: false,

      // 上传状态
      uploadStatus: {
        progress: 0,
        uploading: false,
      },

      // 是否自动上传，在图片选择完成后触发
      autoUpload: false,

      // 外链
      externalLink: {
        input_github: '',
        input_cdn: '',
        github: '',
        cdn: '',
        markdown_gh: '',
        markdown_cdn: '',
      },

      isTransformMarkdown: false,

      // methods
      onSetMaxSizeChane(e: any) {
        this.setMaxSize = e;
      },

      hashRename(e: any) {
        this.isHashRename = e
        if (this.isHashRename) {
          this.filename.now = `${this.filename.name}.${this.filename.hash}.${this.filename.suffix}`
        } else {
          this.filename.now = `${this.filename.name}.${this.filename.suffix}`
        }
      },

      rename(e: any) {
        const {isRename, newName} = e

        if (isRename) {
          this.filename.name = newName
        } else {
          this.filename.name = this.filename.initName
        }

        if (this.isHashRename) {
          this.filename.now = `${this.filename.name}.${this.filename.hash}.${this.filename.suffix}`
        } else {
          this.filename.now = `${this.filename.name}.${this.filename.suffix}`
        }
      },

      onMaxSizeChange(e: any) {
        this.compressSize = e;
      },

      resetUploadInfo() {
        cleanObject(this.imgData)
        cleanObject(this.uploadStatus)
        cleanObject(this.filename)
        cleanObject(this.externalLink)
      },

      uploadImage() {

        const {token, selectedRepos, selectedBranch, selectedDir} = this.userConfigInfo

        if (!token) {
          ElMessage.error('请先完成图床配置！')
          router.push('/config')
          return
        }

        if (!selectedRepos) {
          ElMessage.error('请选择一个仓库！')
          router.push('/config')
          return
        }

        if (!selectedDir) {
          ElMessage.error('目录不能为空！')
          router.push('/config')
          return
        }

        if (!this.imgData.base64Content || !this.filename.now) {
          ElMessage.error('内容不能为空！')
          return
        }

        if (this.filename.now === this.filename.prev) {
          ElMessage.error('该图片已上传！')
          return
        }

        this.uploadStatus.uploading = true;

        const data: any = {
          'message': 'Upload pictures via PicX(https://github.com/XPoet/picx)',
          'branch': selectedBranch,
          'content': this.imgData.base64Content
        }

        if (this.userConfigInfo.email) {
          data.committer = {
            name: this.userConfigInfo.owner,
            email: this.userConfigInfo.email,
          }
        }

        axios.put(
          uploadUrlHandle(this.userConfigInfo, this.filename.now),
          data,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `token ${token}`
            }
          }
        ).then(res => {
          if (res && res.status === 201) {
            ElMessage.success('上传成功！')
            this.uploadedHandle(res)
          } else {
            ElMessage.error('上传失败！')
            this.uploadStatus.uploading = false
          }
        })
      },

      uploadedHandle(res: any) {
        // 上传状态处理
        this.uploadStatus.progress = 100
        this.uploadStatus.uploading = false

        this.filename.prev = this.filename.now

        // 生成外链
        this.externalLink.github = generateExternalLink('github', res.data.content, this.userConfigInfo)
        this.externalLink.cdn = generateExternalLink('cdn', res.data.content, this.userConfigInfo)
        this.externalLink.markdown_gh = generateExternalLink('markdown_gh', res.data.content, this.userConfigInfo)
        this.externalLink.markdown_cdn = generateExternalLink('markdown_cdn', res.data.content, this.userConfigInfo)

        this.externalLink.input_github = this.isTransformMarkdown ? this.externalLink.markdown_gh : this.externalLink.github
        this.externalLink.input_cdn = this.isTransformMarkdown ? this.externalLink.markdown_cdn : this.externalLink.cdn

        const item = {
          uuid: getUuid(),
          dir: this.userConfigInfo.selectedDir,
          name: res.data.content.name,
          path: res.data.content.path,
          sha: res.data.content.sha,
          github_url: this.externalLink.github,
          cdn_url: this.externalLink.cdn,
          markdown_gh: this.externalLink.markdown_gh,
          markdown_cdn: this.externalLink.markdown_cdn,
          deleting: false
        }


        // 如果 this.userConfigInfo.dirList 不存在该目录，则增加
        if (!this.userConfigInfo.dirList.some((v: any) => v.value === item.dir)) {

          // userConfigInfo 增加目录
          store.commit('USER_CONFIG_INFO_ADD_DIR', item.dir)

          // dirImageList 增加目录
          store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.dir)

        }

        // uploadedList 增加图片
        store.dispatch('UPLOADED_LIST_ADD', item)

        // dirImageList 增加图片
        store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item)
      },

      transformMarkdown(e: any) {
        this.isTransformMarkdown = e
        this.externalLink.input_github = e ? this.externalLink.markdown_gh : this.externalLink.github
        this.externalLink.input_cdn = e ? this.externalLink.markdown_cdn : this.externalLink.cdn
      },

      copyLink(type: any) {
        switch (type) {
          case 'CDN':
            CDNExternalLinkInput.value.select()
            break;

          case 'GitHub':
            GitHubExternalLinkInput.value.select()
            break;
        }
        document.execCommand('copy')
        ElMessage.success(`${type}外链复制成功！`)
      },

      getImage(url: any, file: any) {
        this.imgData.base64Url = url
        this.imgData.base64Content = url.split(',')[1]

        cleanObject(this.uploadStatus)

        const {name, hash, suffix} = filenameHandle(file.name)
        this.filename.name = name
        this.filename.hash = hash
        this.filename.suffix = suffix

        this.filename.now = this.isHashRename ? `${name}.${hash}.${suffix}` : file.name
        this.filename.initName = this.filename.name

        this.fileInfo.size = file.size
        this.fileInfo.lastModified = file.lastModified

        if (this.autoUpload) {
          this.uploadImage()
        }
      },

      onFileChange(e: any) {
        const targetFile = e.target.files[0]
        chooseImg(
          targetFile,
          (url: any, file: any) => {
            this.getImage(url, file)
          },
          this.setMaxSize ? this.compressSize * 1024 : null
        )
        store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
      },

      onDrop(e: any) {
        const targetFile = e.dataTransfer.files[0]
        chooseImg(
          targetFile,
          (url: any, file: any) => {
            this.getImage(url, file)
          },
          this.setMaxSize ? this.compressSize * 1024 : null
        )
        store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
      },

      async onPaste(e: any) {
        const {url, file} = await paste(e, this.setMaxSize ? this.compressSize * 1024 : null)
        this.getImage(url, file)
      },

      getFileSize(size: any) {
        return getFileSize(size)
      },

      formatLastModified(t: any) {
        return TimeHelper.formatTimestamp(t)
      }

    })

    watch(() => reactiveData.logoutStatus, (_n, _o) => {
      if (!_n) { // 如果退出登录，清空信息
        reactiveData.resetUploadInfo()
      }
    })

    const onSetMaxSizeChane = (e: any) => {
      reactiveData.onSetMaxSizeChane(e)
    }

    const onMaxSizeChange = (e: any) => {
      reactiveData.onMaxSizeChange(e)
    }

    const rename = (e: any) => {
      reactiveData.rename(e)
    }

    const hashRename = (e: any) => {
      reactiveData.hashRename(e)
    }

    const resetUploadInfo = () => {
      reactiveData.resetUploadInfo()
    }

    const uploadImage = () => {
      reactiveData.uploadImage()
    }

    const transformMarkdown = (e: any) => {
      reactiveData.transformMarkdown(e)
    }


    return {
      ...toRefs(reactiveData),
      GitHubExternalLinkInput,
      CDNExternalLinkInput,
      onSetMaxSizeChane,
      onMaxSizeChange,
      rename,
      hashRename,
      resetUploadInfo,
      uploadImage,
      transformMarkdown,
    }
  }


})
</script>

<style scoped lang="stylus">

@import "../style.styl"

.upload-page-container {
  width 100%
  height 100%
  display flex
  justify-content space-between


  .upload-page-left {
    height 100%
    box-sizing border-box
    margin-right $component-interval

    .uploaded-item {
      margin-bottom 20px

      &:last-child {
        margin-bottom 0
      }

    }
  }


  .upload-page-right {
    box-sizing border-box
    height 100%
    overflow-y auto

    .row-item {
      width 100%
      display flex
      justify-content center
      margin-bottom 16px
      box-sizing border-box

      &:last-child {
        margin-bottom 0
      }
    }


    .upload-area {
      position: relative;
      width: 100%;
      height: 300px;
      border: 3.8px dashed $upload-area-border-color
      box-sizing border-box
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;

      &.focus {
        border-color: $upload-area-focus-color;
      }

      &:hover {
        border-color: $upload-area-focus-color;
      }

      label {
        display: block;
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1000;
        cursor: pointer;
      }

      input[type="file"] {
        position: absolute;
        left: -9999px;
        top: -9999px;
      }

      .tips {
        text-align: center;
        color: #aaa;

        .icon {
          font-size: 100px;
          margin-bottom: 10px;
        }

        .text {
          cursor: default;
          font-size: 20px;
        }
      }

      img {
        object-fit: cover;
        width: 100%;
        height: 100%;
      }

    }


    .upload-status {
      position: relative;
      width: 100%;
      padding: 10px;
      background: $second-background-color;
      color: #666;
      font-size: 12px;
      box-sizing border-box

      .info-item {
        margin-top: 4px;
      }

      .file-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .upload-tips {

        display: flex;
        align-items: center;

        i {
          margin-left: 2px;
          font-size: 20px;
        }
      }

      .wait-upload {
        color: #E6A23C;
      }

      .uploading {
        color: #409EFF;
      }

      .uploaded {
        color: #67C23A;
      }

    }


    .external-link {
      width: 100%;

      .external-link-input {
        margin-bottom: 10px;

        &:last-child {
          margin-bottom: 0;
        }

        .el-input-group__append {
          width: 100px;
          text-align-last: justify;
        }
      }
    }


    .upload-tools {
      width: 100%;

      .repos-dir-info {
        margin-bottom 20px
        font-size 12px

        .repos-dir-info-item {
          margin-right 10px

          &:last-child {
            margin-right 0
          }
        }


      }
    }
  }

}
</style>
