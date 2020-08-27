<template>
  <div class="upload-page-container">

    <div class="upload-page-left picx-container"
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

    <div class="upload-page-right picx-container"
         :style="{
            'width': uploadedImageList.length ? '70%' : '100%'
         }"
    >
      <!-- 上传区域 -->
      <el-row class="row-item">
        <div class="upload-area"
             @dragover.prevent
             @drop.stop.prevent="onDrop"
             @paste="onPaste"
             v-loading="uploadStatus.uploading && uploadStatus.progress !== 100"
             element-loading-text="上传中..."
             element-loading-background="rgba(0, 0, 0, 0.5)"
        >
          <label for="uploader"></label>
          <input id="uploader" type="file" @change="onFileChange">
          <div class="tips" v-if="!imgData.base64Url">
            <i class="icon el-icon-upload"></i>
            <div class="text">拖拽、粘贴、或点击此处上传</div>
          </div>
          <img v-if="imgData.base64Url" :src="imgData.base64Url">
        </div>
      </el-row>

      <!-- 上传状态 -->
      <el-row class="row-item"
              v-if="imgData.base64Url"
      >
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
        </div>
      </el-row>

      <!-- 外链 -->
      <el-row class="row-item"
              v-if="uploadStatus.progress === 100"
      >
        <div class="external-link">
          <el-input class="external-link-input"
                    placeholder="复制GitHub外链..."
                    size="mini"
                    v-model="externalLink.github"
                    ref="GitHubExternalLinkInput"
                    readonly
          >
            <template slot="prepend">GitHub外链</template>
            <el-button slot="append"
                       icon="el-icon-copy-document"
                       @click="copyLink('GitHub')"
            >复制
            </el-button>
          </el-input>
          <el-input class="external-link-input"
                    placeholder="复制CDN外链..."
                    size="mini"
                    v-model="externalLink.cdn"
                    ref="CDNExternalLinkInput"
                    readonly
          >
            <template slot="prepend">CDN外链</template>
            <el-button slot="append"
                       icon="el-icon-copy-document"
                       @click="copyLink('CDN')"

            >复制
            </el-button>
          </el-input>
        </div>
      </el-row>

      <!-- 上传操作 -->
      <el-row class="row-item">

        <div class="upload-tools">
          <div class="repos-dir-info" v-if="userConfigInfo.selectedRepos">
            <el-tag class="repos-dir-info-item">仓库：{{ userConfigInfo.selectedRepos }}</el-tag>
            <el-tag class="repos-dir-info-item">目录：{{ userConfigInfo.selectedDir }}</el-tag>
          </div>

          <UploadTools
            @is-set-max-size="onSetMaxSizeChane"
            @max-size="onMaxSizeChange"
            @rename="rename"
            @hash-named="hashRename"
            @upload-reset="resetUploadInfo"
            @upload-file="uploadImage"
            :is-show-rename="imgData.base64Url !== '' && uploadStatus.progress !== 100"
          />
        </div>
      </el-row>
    </div>
  </div>
</template>

<script>
  import UploadTools from "../components/UploadTools";
  import chooseImg from "../common/utils/chooseImg";
  import paste from "../common/utils/paste";
  import {filenameHandle} from "../common/utils/filenameHandle";
  import uploadUrlHandle from "../common/utils/uploadUrlHandle";
  import generateExternalLink from "../common/utils/generateExternalLink";
  import cleanObject from "../common/utils/cleanObject";
  import {mapGetters} from "vuex";
  import ImageCard from "../components/ImageCard";
  import getUuid from "../common/utils/getUuid";

  export default {
    name: "Upload",

    components: {
      ImageCard,
      UploadTools,
    },

    data() {
      return {
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
          github: '',
          cdn: '',
        },

      }
    },

    mounted() {

    },

    watch: {
      logoutStatus(e) {
        if (!e) { // 如果退出登录，清空信息
          this.resetUploadInfo()
        }
      },
    },

    computed: {
      ...mapGetters({
        userConfigInfo: 'getUserConfigInfo',
        logoutStatus: 'getUserLoggingStatus',
        uploadedImageList: 'getUploadedImageList',
      })
    },

    methods: {

      onSetMaxSizeChane(e) {
        this.setMaxSize = e;
      },

      hashRename(e) {
        this.isHashRename = e
        if (this.isHashRename) {
          this.filename.now = `${this.filename.name}.${this.filename.hash}.${this.filename.suffix}`
        } else {
          this.filename.now = `${this.filename.name}.${this.filename.suffix}`
        }
      },

      rename(e) {
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

      onMaxSizeChange(e) {
        this.compressSize = e;
      },

      resetUploadInfo() {
        cleanObject(this.imgData)
        cleanObject(this.uploadStatus)
        cleanObject(this.filename)
        cleanObject(this.externalLink)
      },

      uploadImage() {
        if (this.userConfigInfo.token === '') {
          this.$message.error('请先进行图床配置！')
          this.$router.push('config')
          return
        }

        if (!this.imgData.base64Content || !this.filename.now) {
          this.$message.error('内容不能为空！')
          return
        }

        if (this.filename.now === this.filename.prev) {
          this.$message.error('该图片已上传！')
          return
        }

        this.uploadStatus.uploading = true;
        const data = {
          "message": "upload from PicX",
          "branch": "master",
          "committer": {
            "name": this.userConfigInfo.owner,
            "email": this.userConfigInfo.email,
          },
          "content": this.imgData.base64Content
        }

        this.$axios.put(
          uploadUrlHandle(this.userConfigInfo, this.filename.now),
          data,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            }
          }
        ).then(res => {
          console.log('res', res);
          if (res.status === 201 && res.statusText === 'Created') {
            this.$message.success('上传成功！')
            this.uploadedHandle(res)
          }
        })
      },

      uploadedHandle(res) {
        // 上传状态处理
        this.uploadStatus.progress = 100
        this.uploadStatus.uploading = false

        this.filename.prev = this.filename.now

        // 生成外链
        this.externalLink.github = generateExternalLink('github', res.data.content, this.userConfigInfo)
        this.externalLink.cdn = generateExternalLink('cdn', res.data.content, this.userConfigInfo)

        const item = {
          uuid: getUuid(),
          dir: this.userConfigInfo.selectedDir,
          name: res.data.content.name,
          path: res.data.content.path,
          sha: res.data.content.sha,
          html_url: res.data.content.html_url,
          github_url: res.data.content['download_url'],
          cdn_url: this.externalLink.cdn,
          deleting: false
        }


        // 如果 userConfigInfo.dirList 不存在该目录，则增加
        if (!this.userConfigInfo.dirList.some(v => v.value === item.dir)) {

          // userConfigInfo 增加目录
          this.$store.commit('USER_CONFIG_INFO_ADD_DIR', item.dir)

          // dirImageList 增加目录
          this.$store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.dir)

        }

        // uploadedList 增加图片
        this.$store.dispatch('UPLOADED_LIST_ADD', item)

        // dirImageList 增加图片
        this.$store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item)
      },

      copyLink(type) {
        switch (type) {
          case 'CDN':
            this.$refs.CDNExternalLinkInput.select()
            break;

          case 'GitHub':
            this.$refs.GitHubExternalLinkInput.select()
            break;
        }
        document.execCommand('copy')
        this.$message.success(`${type}外链复制成功！`)
      },

      getImage(url, fileName) {
        this.imgData.base64Url = url
        this.imgData.base64Content = url.split(',')[1]
        cleanObject(this.uploadStatus)
        const {name, hash, suffix} = filenameHandle(fileName)
        this.filename.name = name
        this.filename.hash = hash
        this.filename.suffix = suffix

        this.filename.now = this.isHashRename ? `${name}.${hash}.${suffix}` : fileName
        this.filename.initName = this.filename.name
        if (this.autoUpload) {
          this.uploadImage()
        }
      },

      onFileChange(e) {
        const targetFile = e.target.files[0];
        chooseImg(
          targetFile,
          (url, fileName) => {
            this.getImage(url, fileName)
          },
          this.setMaxSize ? this.compressSize * 1024 : null
        )
      },

      onDrop(e) {
        const targetFile = e.dataTransfer.files[0];
        chooseImg(
          targetFile,
          (url, fileName) => {
            this.getImage(url, fileName)
          },
          this.setMaxSize ? this.compressSize * 1024 : null
        )
      },

      async onPaste(e) {
        const {url, fileName} = await paste(e, this.setMaxSize ? this.compressSize * 1024 : null)
        this.getImage(url, fileName)
      },
    },
  }
</script>

<style lang="scss">

  $color: #0077b8;

  .upload-page-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    background: #f2f2f2;

    .upload-page-left {
      height: 100%;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;
      margin-right: 20px;

      .uploaded-item {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

      }
    }

    .upload-page-right {
      height: 100%;
      padding: 30px;

      .row-item {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .upload-area {
        position: relative;
        width: 100%;
        height: 300px;
        border: 4px dashed #999;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          cursor: pointer;
          border-color: $color;

          .tips {
            color: $color;
          }
        }

        label {
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 100;
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
        width: 100%;
        padding: 10px;
        background: #f1f1f1;
        color: #666;

        .file-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .upload-tips {

          display: flex;
          align-items: center;

          font-size: 14px;

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

          .el-input-group__prepend {
            width: 66px;
            text-align-last: justify;
          }
        }
      }

      .upload-tools {
        width: 100%;

        .repos-dir-info {

          margin-bottom: 20px;

          .repos-dir-info-item {
            margin-right: 10px;

            &:last-child {
              margin-right: 0;
            }
          }


        }
      }
    }

  }


</style>
