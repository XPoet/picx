<template>
  <div class="upload-page-container">

    <!-- 上传区域 -->
    <el-row class="row-item">
      <div class="upload-area"
           @dragover.prevent
           @drop.stop.prevent="onDrop"
           @paste="onPaste"
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
          >{{ fileName }}
          </div>

          <div class="upload-tips wait-upload" v-if="!uploading">
            等待上传 <i class="el-icon-upload2"></i>
          </div>

          <div class="upload-tips uploading" v-if="uploading && uploadProgress !== 100">
            正在上传 <i class="el-icon-loading"></i>
          </div>

          <div class="upload-tips uploaded" v-if="uploadProgress === 100">
            上传完成 <i class="el-icon-circle-check"></i>
          </div>
        </div>
      </div>
    </el-row>

    <!-- 外链 -->
    <el-row class="row-item"
            v-if="uploadProgress === 100"
    >
      <div class="external-link">

        <el-input class="external-link-input"
                  placeholder="复制GitHub外链..."
                  size="mini"
                  v-model="GitHubExternalLink"
                  ref="GitHubExternalLinkInput"
                  readonly
        >
          <template slot="prepend">GitHub外链</template>
          <el-button slot="append"
                     icon="el-icon-copy-document"
                     @click="copyLink('github')"
          >复制
          </el-button>
        </el-input>
        <el-input class="external-link-input"
                  placeholder="复制CDN外链..."
                  size="mini"
                  v-model="CDNExternalLink"
                  ref="CDNExternalLinkInput"
                  readonly
        >
          <template slot="prepend">CDN外链</template>
          <el-button slot="append"
                     icon="el-icon-copy-document"
                     @click="copyLink('cdn')"

          >复制
          </el-button>
        </el-input>
      </div>
    </el-row>

    <!-- 上传操作 -->
    <el-row class="row-item">

      <div class="upload-tools">
        <div class="repos-dir-info" v-if="config.selectedRepos">
          <el-tag class="repos-dir-info-item">仓库：{{ config.selectedRepos }}</el-tag>
          <el-tag class="repos-dir-info-item">目录：{{ config.selectedDir ? config.selectedDir : '无' }}</el-tag>
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

</template>

<script>
  import UploadTools from "../components/UploadTools";
  import chooseImg from "../utils/chooseImg";
  import paste from "../utils/paste";
  import filenameHandle from "../utils/filenameHandle";
  import Axios from 'axios'
  import uploadUrlHandle from "../utils/uploadUrlHandle";
  import generateExternalLink from "../utils/generateExternalLink";
  import {picx_key} from "../utils/localStorage";

  export default {
    name: "Upload",

    components: {
      UploadTools
    },

    data() {
      return {
        previewImg: '',
        imgBase64: '',
        fileName: '',
        uploadProgress: 0,
        uploading: false,
        autoUpload: false,
        compressSize: 200,
        setMaxSize: false,
        renameWithHash: false,
        config: '',

        // GitHub 外链
        GitHubExternalLink: '',

        // CDN 外链
        CDNExternalLink: '',

        // 选择的外链
        selectedExternalLink: '',
        selectedExternalLinkType: ''
      }
    },

    mounted() {

      this.getUserInfo()

    },


    methods: {
      getUserInfo() {
        const config = localStorage.getItem(picx_key)
        if (config) {
          this.config = JSON.parse(config)
        }
      },

      onSetMaxSizeChane(e) {
        this.setMaxSize = e;
      },

      onRenameChange(e) {
        this.renameWithHash = e;
      },

      onMaxSizeChange(e) {
        this.compressSize = e;
      },

      uploadReset() {
        this.imgBase64 = ''
        this.previewImg = ''
        this.fileName = ''
        this.GitHubExternalLink = ''
        this.CDNExternalLink = ''
        this.uploadProgress = 0
        this.uploading = false
      },

      uploadFile() {

        let config = localStorage.getItem(picx_key)
        if (config) {
          config = JSON.parse(config)
          if (this.imgBase64 && this.fileName) {
            this.uploading = true;
            const data = {
              "message": "upload from PicX",
              "branch": "master",
              "committer": {
                "name": config.username,
                "email": config.email,
              },
              "content": this.imgBase64
            }

            Axios.put(
              uploadUrlHandle(config, this.fileName),
              data,
              {
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `token ${config.token}`
                }
              }
            )
              .then(res => {
                console.log('res', res);
                if (res.status === 201 && res.statusText === 'Created') {
                  this.uploadProgress = 100;
                  this.$message.success('上传成功！')


                  // 生成外链
                  this.GitHubExternalLink = generateExternalLink('github', res.data.content, config)
                  this.CDNExternalLink = generateExternalLink('cdn', res.data.content, config)

                }
              })
              .catch(error => {
                this.$message.error('上传失败！')
                console.log('error', error);
              })

          } else {
            this.$message.error('内容不能为空！')
          }

        } else {
          this.$message.info('请先进行图床配置！')
          this.$router.push('config')
        }

      },

      copyLink(type) {

        switch (type) {

          case 'cdn':
            this.$refs.CDNExternalLinkInput.select()
            break;

          case 'github':
            this.$refs.GitHubExternalLinkInput.select()
            break;
        }
        document.execCommand('copy')
        this.$message.success('复制成功！')
      },

      getImage(url, fileName) {
        this.previewImg = url
        this.imgBase64 = url.split(',')[1]
        this.fileName = this.renameWithHash ? filenameHandle(fileName) : fileName

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


</style>
