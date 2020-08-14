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
          <div class="text">将图片拖至此处，或点击此处</div>
        </div>
        <img v-if="previewImg" class="target" :src="previewImg">
      </div>
    </el-row>

    <!-- 上传状态 -->
    <el-row class="row-item"
            v-if="previewImg"
    >
      <div class="upload-progress">
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
    </el-row>

    <!-- 外链 -->
    <el-row class="row-item">
      <div class="external-link">
        <el-input placeholder="复制GitHub外链..."
                  size="mini"
                  v-model="GitHubExternalLink"
                  ref="GitHubExternalLinkInput"
                  readonly
        >
          <template slot="prepend">GitHub外链：</template>
          <el-button slot="append"
                     icon="el-icon-copy-document"
                     @click="copyLink('github')"
          >复制</el-button>
        </el-input>
        <el-input placeholder="复制CDN外链..."
                  size="mini"
                  v-model="CDNExternalLink"
                  ref="CDNExternalLinkInput"
                  readonly
        >
          <template slot="prepend">CDN外链：</template>
          <el-button slot="append"
                     icon="el-icon-copy-document"
                     @click="copyLink('cdn')"

          >复制
          </el-button>
        </el-input>
      </div>
    </el-row>

    <el-row class="row-item">
      <div class="upload-tools">
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

        // GitHub 外链
        GitHubExternalLink: '',

        // CDN 外链
        CDNExternalLink: '',
      }
    },

    methods: {
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

        let config = localStorage.getItem('PICX')
        if (config) {
          config = JSON.parse(config)
          if (this.imgBase64 && this.fileName) {

            this.uploading = true;


            const data = {
              "message": "upload from PicX",
              "branch": config.branch ? config.branch : 'master',
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
          this.$router.push('/config')
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

<style scoped lang="scss">

  $color: #0077b8;

  .upload-page-container {

    width: 100%;
    height: 100%;
    position: relative;

    .row-item {
      display: flex;
      justify-content: center;
      margin-bottom: 30px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .upload-area {
      position: relative;
      width: 600px;
      height: 300px;
      border: 4px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: $color;
        cursor: pointer;
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

    .upload-progress {
      width: 600px;
      padding: 5px;
      background: #f1f1f1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #666;

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
        color: #409EFF;
      }

      .uploading {
        color: #E6A23C;
      }

      .uploaded {
        color: #67C23A;
      }

    }

    .external-link {
      width: 600px;
    }

    .upload-tools {
      position: relative;
      width: 600px;
      border: 1px solid #ccc;
      padding: 20px;
    }

  }


</style>
