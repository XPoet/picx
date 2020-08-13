<template>

  <div>

    <div class="upload-container">
      <div class="upload-area"
           @dragover.prevent
           @drop.stop.prevent="onDrop"
           @paste="onPaste"
      >
        <label class="target" for="uploader"></label>
        <input id="uploader" @change="onFileChange" type="file">
        <h3 v-if="!previewImg">将图片拖至此处，或点击上传</h3>
        <img v-if="previewImg" class="target" :src="previewImg">
      </div>
    </div>

    <div class="upload-tools">
      <UploadTools
        @is-set-max-size="onSetMaxSizeChane"
        @is-rename="onRenameChange"
        @max-size="onMaxSizeChange"
        @upload-reset="uploadReset"
        @upload-file="uploadFile"
      />
    </div>

  </div>

</template>

<script>
  import UploadTools from "../components/UploadTools";
  import chooseImg from "../utils/chooseImg";
  import paste from "../utils/paste";
  import filenameHandle from "../utils/filenameHandle";
  import Axios from 'axios'
  import uploadUrlHandle from "../utils/uploadUrlHandle";

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
        autoUpload: false,
        compressSize: 200,
        setMaxSize: false,
        renameWithHash: true,
      }
    },

    methods: {
      onSetMaxSizeChane(e) {
        this.setMaxSize = e;
      },

      onRenameChange(e) {
        this.renameWithHash = e;
        console.log(this.renameWithHash);
      },

      onMaxSizeChange(e) {
        this.compressSize = e;
      },

      uploadReset() {
        this.imgBase64 = ''
        this.previewImg = ''
      },

      uploadFile() {

        let config = localStorage.getItem('PICX')
        if (config) {
          config = JSON.parse(config)
          if (this.imgBase64 && this.fileName) {
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
                  this.$message.success('上传成功！')
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

  .upload-container {

    position: relative;
    display: flex;
    justify-content: center;
    padding: 20px;

    /*background: skyblue;*/

    .upload-area {
      position: relative;
      width: 600px;
      height: 300px;
      border: 2px dashed #666;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: #0080ef;
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

      h3 {
        text-align: center;
        cursor: default;
        color: #C0C4CC;
      }

      img {
        object-fit: cover;
        width: 100%;
        height: 100%;
      }

    }


  }

  .upload-tools {
    position: relative;
    display: flex;
    padding: 20px;
  }


</style>
