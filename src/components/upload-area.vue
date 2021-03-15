<template>
  <div class="upload-area active-upload"
       :class="{'focus': uploadAreaActive}"
       @dragover.prevent
       @drop.stop.prevent="onDrop"
       @paste="onPaste"
       v-loading="imageLoading"
       element-loading-text="图片上传中..."
       element-loading-background="rgba(0, 0, 0, 0.5)"
  >
    <label for="uploader"
           class="active-upload"
           v-if="uploadAreaActive"
    ></label>
    <input id="uploader"
           type="file"
           @change="onSelect"
    >
    <div class="tips active-upload" v-if="!toUploadImage.curImgBase64Url">
      <i class="icon el-icon-upload active-upload"></i>
      <div class="text active-upload">拖拽、粘贴、或点击此处上传</div>
    </div>
    <img class="active-upload"
         v-if="toUploadImage.curImgBase64Url"
         :src="toUploadImage.curImgBase64Url"
         alt="Pictures to be uploaded"
    >
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from 'vue'
import { filenameHandle } from "../common/utils/fileHandleHelper"
import chooseImg from "../common/utils/chooseImg"
import createToUploadImageObject from "../common/utils/createToUploadImageObject"
import paste from "../common/utils/paste"
import { useStore } from "vuex"

export default defineComponent({
  name: 'upload-area',

  props: {
    imageLoading: {
      type: Boolean,
      default: false
    }
  },

  setup() {
    const store = useStore()

    const reactiveData = reactive({

      uploadAreaActive: computed((): boolean => store.getters.getUploadAreaActive),
      uploadSettings: computed(() => store.getters.getUploadSettings).value,
      toUploadImage: computed(() => store.getters.getToUploadImage),

      // 选择图片
      onSelect(e: any) {
        const targetFile = e.target.files[0]
        chooseImg(
          targetFile,
          (url: any, file: any) => {
            this.getImage(url, file)
          },
          this.uploadSettings.isSetMaxSize ? this.uploadSettings.compressSize * 1024 : null
        )
        store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
      },

      // 拖拽图片
      onDrop(e: any) {
        const targetFile = e.dataTransfer.files[0]
        chooseImg(
          targetFile,
          (url: any, file: any) => {
            this.getImage(url, file)
          },
          this.uploadSettings.isSetMaxSize ? this.uploadSettings.compressSize * 1024 : null
        )
        store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
      },

      // 复制图片
      async onPaste(e: any) {
        const {url, file} = await paste(e, this.uploadSettings.isSetMaxSize ? this.uploadSettings.compressSize * 1024 : null)
        this.getImage(url, file)
      },

      // 获取图片对象
      getImage(url: any, file: any) {

        store.dispatch('TO_UPLOAD_IMAGE_SET_URL', url)

        if (this.toUploadImage.list.length === this.toUploadImage.uploadedNumber) {
          store.dispatch('TO_UPLOAD_IMAGE_CLEAN_LIST')
          store.dispatch('TO_UPLOAD_IMAGE_CLEAN_UPLOADED_NUMBER')
        }

        const curImg = createToUploadImageObject()

        curImg.imgData.base64Url = url
        curImg.imgData.base64Content = url.split(',')[1]

        const {name, hash, suffix} = filenameHandle(file.name)

        curImg.uuid = hash

        curImg.fileInfo.size = file.size
        curImg.fileInfo.lastModified = file.lastModified

        curImg.filename.name = name
        curImg.filename.hash = hash
        curImg.filename.suffix = suffix
        curImg.filename.now = `${name}.${hash}.${suffix}`
        curImg.filename.initName = name

        store.dispatch('TO_UPLOAD_IMAGE_LIST_ADD', JSON.parse(JSON.stringify(curImg)))
      },
    })

    return {
      ...toRefs(reactiveData)
    }
  }


})
</script>

<style scoped lang="stylus">

@import "../style.styl"

.upload-area {
  position: relative;
  width: 100%;
  height: 300px;
  border: 4px dashed $upload-area-border-color
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
</style>
