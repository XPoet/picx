<template>
  <div class="upload-page-container">
    <div
      class="upload-page-left page-container"
      v-if="uploadedImageList.length && userSettings.elementPlusSize === ElementPlusSizeEnum.large"
      :style="{
        width: '280rem'
      }"
    >
      <div class="uploaded-item" v-for="(item, index) in uploadedImageList" :key="index">
        <image-card :image-obj="item" :is-uploaded="true" />
      </div>
    </div>

    <div class="upload-page-right page-container">
      <!-- 上传区域 -->
      <div class="row-item">
        <div class="content-box">
          <upload-area :image-loading="uploading" ref="uploadAreaRef"></upload-area>
        </div>
      </div>

      <!-- 待上传的图片列表 -->
      <div class="row-item">
        <div class="content-box">
          <to-upload-image-card ref="toUploadImageCardRef" :loading-all-image="uploading" />
        </div>
      </div>

      <!-- 重置 & 上传 -->
      <div class="row-item">
        <div class="content-box" style="text-align: right">
          <el-button
            :disabled="uploading"
            v-if="toUploadImage.list.length"
            plain
            type="warning"
            @click="resetUploadInfo"
          >
            重置 {{ shortcutKey }} + A
          </el-button>
          <el-button :loading="uploading" plain type="primary" @click="uploadImage">
            上传 {{ shortcutKey }} + S
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, ref, Ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import ToUploadImageCard from '@/components/to-upload-image-card/to-upload-image-card.vue'
import UploadArea from '@/components/upload-area/upload-area.vue'
import { ElementPlusSizeEnum, ToUploadImageModel, UploadStatusEnum } from '@/common/model'
import { batchCopyImageLinks, copyImageLink, getOSName } from '@/utils'

const store = useStore()
const router = useRouter()

const toUploadImageCardRef: Ref = ref<null | HTMLElement>(null)
const uploadAreaRef: Ref = ref<null | HTMLElement>(null)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const userSettings = computed(() => store.getters.getUserSettings)
const logoutStatus = computed(() => store.getters.getUserLoginStatus)
const uploadedImageList = computed(() => store.getters.getUploadedImageList)
const toUploadImage = computed(() => store.getters.getToUploadImage)
const uploading = ref(false)
const shortcutKey = computed(() => (getOSName() === 'mac' ? 'Command' : 'Ctrl'))

const uploadImage = () => {
  const { token, selectedRepo, selectedDir } = userConfigInfo.value

  if (!token) {
    ElMessage.error('请先完成图床配置！')
    router.push('/config')
    return
  }

  if (!selectedRepo) {
    ElMessage.error('请选择一个仓库！')
    router.push('/config')
    return
  }

  if (!selectedDir) {
    ElMessage.error('目录不能为空！')
    router.push('/config')
    return
  }

  if (toUploadImage.value.list.length === 0) {
    ElMessage.error('图片不能为空！')
    return
  }

  if (toUploadImage.value.list.length === toUploadImage.value.uploadedNumber) {
    ElMessage.error('请选择要上传的图片！')
    return
  }

  uploading.value = true
  toUploadImageCardRef.value
    .goUploadImages(userConfigInfo.value)
    .then((v: UploadStatusEnum) => {
      uploading.value = false
      // eslint-disable-next-line default-case
      switch (v) {
        // 单张图片上传成功
        case UploadStatusEnum.uploaded:
          store.dispatch('TO_UPLOAD_IMAGE_CLEAN_URL')
          ElMessage.success('图片上传成功')
          // 自动复制这张图片链接到系统剪贴板
          copyImageLink(
            toUploadImage.value.list[0].uploadedImg,
            userConfigInfo.value,
            userSettings.value,
            true
          )
          break

        // 所有图片上传成功
        case UploadStatusEnum.allUploaded:
          store.dispatch('TO_UPLOAD_IMAGE_CLEAN_URL')
          ElMessage.success('图片批量上传成功')
          // 自动复制这些图片链接到系统剪贴板
          batchCopyImageLinks(
            toUploadImage.value.list.map((x: ToUploadImageModel) => x.uploadedImg),
            userConfigInfo.value,
            userSettings.value,
            true
          )
          break

        // 上传失败（网络错误等原因）
        case UploadStatusEnum.uploadFail:
          store.dispatch('TO_UPLOAD_IMAGE_LIST_FAIL')
          ElMessage.error('上传失败，请稍后重试！')
          break
      }
    })
    .catch((e: any) => {
      console.error('upload error: ', e)
      uploading.value = false
    })
}

const resetUploadInfo = () => {
  uploading.value = false
  store.dispatch('TO_UPLOAD_IMAGE_LOGOUT')
  store.dispatch('UPLOADED_LIST_LOGOUT')
}

watch(
  () => logoutStatus,
  (_n) => {
    // 如果退出登录，清空信息
    // eslint-disable-next-line no-unused-expressions
    !_n && resetUploadInfo()
  }
)

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    const keyCode = e.keyCode || e.which || e.charCode
    const ctrlKey = e.ctrlKey || e.metaKey

    // 重置操作快捷组合键 Command + A
    if (ctrlKey && keyCode === 65) {
      if (toUploadImage.value.list.length) {
        resetUploadInfo()
        e.preventDefault()
      }
    }

    // 上传操作快捷组合键 Command + S
    if (ctrlKey && keyCode === 83) {
      if (!uploading.value) {
        uploadImage()
        e.preventDefault()
      }
    }
  })
})
</script>

<style lang="stylus">
@import "./upload-image.styl"
</style>
