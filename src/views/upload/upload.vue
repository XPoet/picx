<template>
  <div class="upload-page-container">
    <div
      class="upload-page-left page-container"
      v-if="uploadedImageList.length && userSettings.elementPlusSize === 'large'"
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
          <upload-area :image-loading="imageLoading" ref="uploadAreaDom"></upload-area>
        </div>
      </div>

      <!-- 待上传的图片列表 -->
      <div class="row-item">
        <div class="content-box">
          <to-upload-image-card
            ref="toUploadImageCardDom"
            :loading-all-image="imageLoading"
          />
        </div>
      </div>

      <!-- 重置 & 上传 -->
      <div class="row-item">
        <div class="content-box" style="text-align: right">
          <el-button
            plain
            type="warning"
            @click="resetUploadInfo"
            v-if="toUploadImage.list.length"
            >重置
          </el-button>
          <el-button plain type="primary" @click="uploadImage"> 上传 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, ref, Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import imageCard from '@/components/image-card/image-card.vue'
import toUploadImageCard from '@/components/to-upload-image-card/to-upload-image-card.vue'
import uploadArea from '@/components/upload-area/upload-area.vue'
import { UploadStatusEnum } from '@/common/model/upload.model'

const store = useStore()
const router = useRouter()

const GitHubExternalLinkInput: Ref = ref<null | HTMLElement>(null)
const CDNExternalLinkInput: Ref = ref<null | HTMLElement>(null)
const toUploadImageCardDom: Ref = ref<null | HTMLElement>(null)
const uploadAreaDom: Ref = ref<null | HTMLElement>(null)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const userSettings = computed(() => store.getters.getUserSettings)
const logoutStatus = computed(() => store.getters.getUserLoggingStatus)
const uploadedImageList = computed(() => store.getters.getUploadedImageList)
const toUploadImage = computed(() => store.getters.getToUploadImage)
const imageLoading = ref(false)

const uploadImage = () => {
  const { token, selectedRepos, selectedDir } = userConfigInfo.value

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

  if (toUploadImage.value.list.length === 0) {
    ElMessage.error('图片不能为空！')
    return
  }

  if (toUploadImage.value.list.length === toUploadImage.value.uploadedNumber) {
    ElMessage.error('请选择要上传的图片！')
    return
  }

  imageLoading.value = true
  toUploadImageCardDom.value
    .uploadImage_all(userConfigInfo.value)
    .then((v: UploadStatusEnum) => {
      // eslint-disable-next-line default-case
      switch (v) {
        // 单张图片上传成功
        case UploadStatusEnum.uploaded:

        // 所有图片上传成功
        // eslint-disable-next-line no-fallthrough
        case UploadStatusEnum.allUploaded:
          imageLoading.value = false
          store.dispatch('TO_UPLOAD_IMAGE_CLEAN_URL')
          break

        // 上传失败（网络错误等原因）
        case UploadStatusEnum.uploadFail:
          imageLoading.value = false
          store.dispatch('TO_UPLOAD_IMAGE_LIST_FAIL')
          break
      }
    })
    .catch((e: any) => {
      console.error('upload error: ', e)
      imageLoading.value = false
    })
}

const resetUploadInfo = () => {
  imageLoading.value = false
  store.dispatch('TO_UPLOAD_IMAGE_LOGOUT')
}

watch(
  () => logoutStatus,
  (_n) => {
    // 如果退出登录，清空信息
    // eslint-disable-next-line no-unused-expressions
    !_n && resetUploadInfo()
  }
)
</script>

<style lang="stylus">
@import "upload.styl"
</style>
