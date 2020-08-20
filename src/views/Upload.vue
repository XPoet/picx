<template>
  <div class="upload-page-container">

    <div class="upload-page-left"
         v-if="uploadedList.length"
         :style="{
            'width': '30%'
         }"
    >
      <UploadedList :uploadedList="uploadedList"></UploadedList>
    </div>

    <div class="upload-page-right"
         :style="{
            'width': uploadedList.length ? '70%' : '100%'
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
          <label class="target" for="uploader"></label>
          <input id="uploader" type="file" @change="onFileChange">
          <div class="tips" v-if="!previewImg">
            <i class="icon el-icon-upload"></i>
            <div class="text">拖拽、粘贴、或点击此处上传</div>
          </div>
          <img v-if="previewImg" class="target" :src="previewImg">
        </div>
      </el-row>

      <!-- 上传状态 -->
      <el-row class="row-item"
              v-if="previewImg"
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
            @is-rename="onRenameChange"
            @max-size="onMaxSizeChange"
            @upload-reset="uploadReset"
            @upload-file="uploadFile"
          />
        </div>
      </el-row>
    </div>
  </div>

</template>

<script>
  import UploadTools from "../components/UploadTools";
  import UploadedList from "../components/UploadedList";
  import chooseImg from "../common/utils/chooseImg";
  import paste from "../common/utils/paste";
  import filenameHandle from "../common/utils/filenameHandle";
  import uploadUrlHandle from "../common/utils/uploadUrlHandle";
  import generateExternalLink from "../common/utils/generateExternalLink";
  import {PICX_KEY} from "../common/model/localStorage";
  import cleanObject from "../common/utils/cleanObject";

  export default {
    name: "Upload",

    components: {
      UploadTools,
      UploadedList,
    },

    data() {
      return {
        // 图片压缩大小
        compressSize: 200,

        previewImg: '',
        imgBase64: '',

        filename: {
          prev: '',
          now: '',
          normalName: '',
          hashName: '',
        },

        setMaxSize: false,
        renameWithHash: false,

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

        // 用户配置信息
        userConfigInfo: {},

        // 保存已上传的图片
        uploadedList: []

      }
    },

    mounted() {
      this.getUserConfigInfo()
      let uploaded = sessionStorage.getItem(PICX_KEY)
      if (uploaded) {
        this.uploadedList = JSON.parse(uploaded)
      }
    },

    methods: {
      getUserConfigInfo() {
        const config = localStorage.getItem(PICX_KEY)
        if (config) {
          this.userConfigInfo = JSON.parse(config)
        }
      },

      onSetMaxSizeChane(e) {
        this.setMaxSize = e;
      },

      onRenameChange(e) {
        this.filename.now = e ? this.filename.hashName : this.filename.normalName
        this.renameWithHash = e
      },

      onMaxSizeChange(e) {
        this.compressSize = e;
      },

      uploadReset() {
        this.imgBase64 = ''
        this.previewImg = ''
        cleanObject(this.uploadStatus)
        cleanObject(this.filename)
        cleanObject(this.externalLink)
      },

      uploadFile() {

        if (!this.userConfigInfo) {
          this.$message.error('请先进行图床配置！')
          this.$router.push('config')
          return
        }

        if (!this.imgBase64 || !this.filename.now) {
          this.$message.error('内容不能为空！')
          return
        }

        if (this.filename.now === this.filename.prev) {
          this.$message.error('该文件已上传！')
          return
        }

        this.uploadStatus.uploading = true;
        const data = {
          "message": "upload from PicX",
          "branch": "master",
          "committer": {
            "name": this.userConfigInfo.username,
            "email": this.userConfigInfo.email,
          },
          "content": this.imgBase64
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
        )
          .then(res => {
            console.log('res', res);
            if (res.status === 201 && res.statusText === 'Created') {
              this.uploadStatus.progress = 100
              this.uploadStatus.uploading = false
              this.filename.prev = this.filename.now
              this.uploadedHandle(res)
              this.$message.success('上传成功！')
            }
          })
          .catch(error => {
            this.$message.error('上传失败！')
            console.log('error', error);
          })
      },

      uploadedHandle(res) {
        // 生成外链
        this.externalLink.github = generateExternalLink('github', res.data.content, this.userConfigInfo)
        this.externalLink.cdn = generateExternalLink('cdn', res.data.content, this.userConfigInfo)

        this.uploadedList.unshift({
          name: res.data.content.name,
          path: res.data.content.path,
          sha: res.data.content.sha,
          api_url: res.data.content.url,
          html_url: res.data.content.html_url,
          github_url: this.externalLink.github,
          cdn_url: this.externalLink.cdn,
          deleting: false
        })
        sessionStorage.setItem(PICX_KEY, JSON.stringify(this.uploadedList))
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
        this.previewImg = url
        this.imgBase64 = url.split(',')[1]
        cleanObject(this.uploadStatus)
        this.filename.normalName = fileName
        this.filename.hashName = filenameHandle(fileName)
        this.filename.now = this.renameWithHash ? this.filename.hashName : fileName
        if (this.autoUpload) {
          this.uploadFile()
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

    }

  }
</script>

<style lang="scss">

  $color: #0077b8;

  .upload-page-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;

    .upload-page-left {
      height: 100%;
      border-right: 1px solid #ccc;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        height: 5px;
        width: 5px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 5px;
        background: rgba(0, 0, 0, 0.25)
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

    }

    .upload-page-right {
      height: 100%;
      padding: 30px;
      box-sizing: border-box;

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
