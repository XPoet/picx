<template>
  <div
    class="upload-area active-upload"
    :class="{ focus: uploadAreaActive }"
    @dragover.prevent
    @drop.stop.prevent="onDrop"
    @paste="onPaste"
    v-loading="imageLoading"
    element-loading-text="图片上传中..."
    element-loading-background="rgba(0, 0, 0, 0.5)"
  >
    <label for="uploader" class="active-upload" v-if="uploadAreaActive"></label>
    <input id="uploader" type="file" @change="onSelect" multiple="multiple" />
    <div class="tips active-upload" v-if="!toUploadImage.curImgBase64Url">
      <el-icon class="icon active-upload"><UploadFilled /></el-icon>
      <div class="text active-upload">拖拽、粘贴、或点击此处上传</div>
    </div>
    <img
      class="active-upload"
      v-if="toUploadImage.curImgBase64Url"
      :src="toUploadImage.curImgBase64Url"
      alt="Pictures to be uploaded"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from 'vue'
import { useStore } from '@/store'
import { filenameHandle } from '@/utils/file-handle-helper'
import selectedFileHandle, { handleResult } from '@/utils/selected-file-handle'
import createToUploadImageObject from '@/utils/create-to-upload-image'
import paste from '@/utils/paste'
import Upload from '@/views/upload/upload.vue'

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
      userConfigInfo: computed(() => store.getters.getUserConfigInfo).value,
      userSettings: computed(() => store.getters.getUserSettings).value,
      uploadAreaActive: computed((): boolean => store.getters.getUploadAreaActive),
      uploadSettings: computed(() => store.getters.getUploadSettings).value,
      toUploadImage: computed(() => store.getters.getToUploadImage).value,

      // 选择图片
      onSelect(e: any) {
        store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
        // eslint-disable-next-line no-restricted-syntax
        for (const file of e.target.files) {
          selectedFileHandle(file, this.uploadSettings.imageMaxSize)?.then((result) => {
            if (!result) {
              return
            }
            const { base64, originalFile, compressFile } = result
            this.getImage(base64, originalFile, compressFile)
          })
        }
      },

      // 拖拽图片
      onDrop(e: any) {
        store.commit('CHANGE_UPLOAD_AREA_ACTIVE', true)
        // eslint-disable-next-line no-restricted-syntax
        for (const file of e.dataTransfer.files) {
          selectedFileHandle(file, this.uploadSettings.imageMaxSize)?.then((result) => {
            if (!result) {
              return
            }
            const { base64, originalFile, compressFile } = result
            this.getImage(base64, originalFile, compressFile)
          })
        }
      },

      // 复制图片
      async onPaste(e: any) {
        const { base64, originalFile, compressFile }: handleResult = await paste(
          e,
          this.uploadSettings.imageMaxSize
        )
        this.getImage(base64, originalFile, compressFile)
      },

      // 获取图片对象
      getImage(base64Data: string, originFile: File, compressFile?: File) {
        if (
          this.toUploadImage.list.length === this.toUploadImage.uploadedNumber &&
          this.toUploadImage.list.length > 0 &&
          this.toUploadImage.uploadedNumber > 0
        ) {
          store.dispatch('TO_UPLOAD_IMAGE_CLEAN_LIST')
          store.dispatch('TO_UPLOAD_IMAGE_CLEAN_UPLOADED_NUMBER')
        }

        const { defaultHash, isCompress, defaultPrefix, prefixName } = this.userSettings
        const file = isCompress ? compressFile : originFile
        const curImg = createToUploadImageObject()

        curImg.imgData.base64Url = base64Data
        // eslint-disable-next-line prefer-destructuring
        curImg.imgData.base64Content = base64Data.split(',')[1]

        const { name, hash, suffix } = filenameHandle(file?.name)
        curImg.uuid = hash
        curImg.fileInfo.compressedSize = compressFile?.size
        curImg.fileInfo.originSize = originFile.size
        curImg.fileInfo.size = file?.size
        curImg.fileInfo.lastModified = file?.lastModified

        curImg.filename.initName = name
        curImg.filename.name = defaultPrefix ? `${prefixName}${name}` : name
        curImg.filename.prefixName = prefixName
        curImg.filename.hash = hash
        curImg.filename.suffix = suffix
        curImg.filename.now = defaultHash
          ? `${curImg.filename.name}.${hash}.${suffix}`
          : `${curImg.filename.name}.${suffix}`
        curImg.filename.isHashRename = defaultHash
        curImg.filename.isPrefix = defaultPrefix

        store.dispatch('TO_UPLOAD_IMAGE_LIST_ADD', JSON.parse(JSON.stringify(curImg)))
        store.dispatch('TO_UPLOAD_IMAGE_SET_CURRENT', {
          uuid: hash,
          base64Url: base64Data
        })
      }
    })

    return {
      ...toRefs(reactiveData)
    }
  }
})
</script>

<style scoped lang="stylus">
@import "upload-area.styl"
</style>
