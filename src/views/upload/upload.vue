<template>
  <div class="upload-page-container">
    <div
      class="upload-page-left page-container"
      v-if="uploadedImageList.length"
      :style="{
        width: '30%'
      }"
    >
      <div class="uploaded-item" v-for="(item, index) in uploadedImageList" :key="index">
        <image-card :image-obj="item" :is-uploaded="true" />
      </div>
    </div>

    <div
      class="upload-page-right page-container"
      :style="{
        width: uploadedImageList.length ? '70%' : '100%'
      }"
    >
      <!-- 上传区域 -->
      <div class="row-item">
        <div class="content-box">
          <upload-area :image-loading="imageLoading" ref="uploadAreaDom"></upload-area>
        </div>
      </div>

      <!-- 待上传的图片列表 -->
      <div class="row-item">
        <div class="content-box">
          <to-upload-image-card ref="toUploadImageCardDom" :loading-all-image="imageLoading" />
        </div>
      </div>

      <!-- 重置 & 上传 -->
      <div class="row-item">
        <div class="content-box" style="text-align: right">
          <el-button plain size="small" @click="resetUploadInfo" v-if="toUploadImage.list.length">重置 </el-button>
          <el-button type="primary" plain size="small" @click="uploadImage">上传 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, toRefs, watch, ref, Ref } from 'vue'
import { useStore } from '@/store'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import imageCard from '@/components/image-card/image-card.vue'
import toUploadImageCard from '@/components/to-upload-image-card/to-upload-image-card.vue'
import uploadArea from '@/components/upload-area/upload-area.vue'
import { UploadStatusEnum } from '@/common/model/upload.model'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'upload',

  components: {
    imageCard,
    toUploadImageCard,
    uploadArea
  },

  setup() {
    const store = useStore()
    const router = useRouter()

    const GitHubExternalLinkInput: Ref = ref<null | HTMLElement>(null)
    const CDNExternalLinkInput: Ref = ref<null | HTMLElement>(null)
    const toUploadImageCardDom: Ref = ref<null | HTMLElement>(null)
    const uploadAreaDom: Ref = ref<null | HTMLElement>(null)

    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,
      logoutStatus: computed(() => store.getters.getUserLoggingStatus),
      uploadedImageList: computed(() => store.getters.getUploadedImageList),
      toUploadImage: computed(() => store.getters.getToUploadImage),
      imageLoading: false
    })

    const uploadImage = () => {
      const { token, selectedRepos, selectedDir } = reactiveData.userConfigInfo

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

      if (reactiveData.toUploadImage.list.length === 0) {
        ElMessage.error('图片不能为空！')
        return
      }

      if (reactiveData.toUploadImage.list.length === reactiveData.toUploadImage.uploadedNumber) {
        ElMessage.error('请选择要上传的图片！')
        return
      }

      reactiveData.imageLoading = true
      toUploadImageCardDom.value
        .uploadImage_all(reactiveData.userConfigInfo)
        .then((v: UploadStatusEnum) => {
          // eslint-disable-next-line default-case
          switch (v) {
            // 单张图片上传成功
            case UploadStatusEnum.uploaded:

            // 所有图片上传成功
            // eslint-disable-next-line no-fallthrough
            case UploadStatusEnum.allUploaded:
              reactiveData.imageLoading = false
              store.dispatch('TO_UPLOAD_IMAGE_CLEAN_URL')
              break

            // 上传失败（网络错误等原因）
            case UploadStatusEnum.uploadFail:
              reactiveData.imageLoading = false
              store.dispatch('TO_UPLOAD_IMAGE_LIST_FAIL')
              break
          }
        })
        .catch((e: any) => {
          console.error('upload error: ', e)
          reactiveData.imageLoading = false
        })
    }

    const resetUploadInfo = () => {
      reactiveData.imageLoading = false
      store.dispatch('TO_UPLOAD_IMAGE_LOGOUT')
    }

    watch(
      () => reactiveData.logoutStatus,
      (_n) => {
        // 如果退出登录，清空信息
        // eslint-disable-next-line no-unused-expressions
        !_n && resetUploadInfo()
      }
    )

    return {
      ...toRefs(reactiveData),
      GitHubExternalLinkInput,
      CDNExternalLinkInput,
      toUploadImageCardDom,
      uploadAreaDom,
      resetUploadInfo,
      uploadImage
    }
  }
})
</script>

<style scoped lang="stylus">
@import "upload.styl"
</style>
