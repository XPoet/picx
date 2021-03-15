<template>
  <div class="upload-page-container">
    <div class="upload-page-left page-container"
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

    <div class="upload-page-right page-container"
         :style="{
            'width': uploadedImageList.length ? '70%' : '100%'
         }"
    >
      <!-- 上传区域 -->
      <div class="row-item">
        <div class="content-box">
          <UploadArea :image-loading="imageLoading"
                      ref="uploadArea_dom"
          ></UploadArea>
        </div>
      </div>

      <!-- 待上传的图片列表 -->
      <div class="row-item">
        <div class="content-box">
          <ToUploadImageCard ref="toUploadImageCard_dom"
                             :loading-all-image="imageLoading"
          ></ToUploadImageCard>
        </div>
      </div>

      <div class="row-item">
        <div class="content-box" style="text-align: right;">
          <el-button plain
                     size="small"
                     @click="resetUploadInfo"
          >重置
          </el-button>
          <el-button type="primary"
                     plain
                     size="small"
                     @click="uploadImage"
          >上传
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, toRefs, watch, ref, Ref } from 'vue'
import { useStore } from 'vuex'
import { UserConfigInfoModel } from '../common/model/model'
import UploadTools from '@/components/upload-tools.vue'
import ImageCard from '@/components/image-card.vue'
import ToUploadImageCard from '@/components/to-upload-image-card.vue'
import UploadArea from '@/components/upload-area.vue'
import { UploadStatusEnum } from '../common/model/upload.model'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'


export default defineComponent({
  name: 'Upload',

  components: {
    ImageCard,
    UploadTools,
    ToUploadImageCard,
    UploadArea
  },

  setup() {
    const store = useStore()
    const router = useRouter()

    const GitHubExternalLinkInput: Ref = ref<null | HTMLElement>(null)
    const CDNExternalLinkInput: Ref = ref<null | HTMLElement>(null)
    const toUploadImageCard_dom: Ref = ref<null | HTMLElement>(null)
    const uploadArea_dom: Ref = ref<null | HTMLElement>(null)

    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,
      logoutStatus: computed(() => store.getters.getUserLoggingStatus),
      uploadedImageList: computed(() => store.getters.getUploadedImageList),
      toUploadImage: computed(() => store.getters.getToUploadImage),
      imageLoading: false
    })


    const uploadImage = () => {

      const {
        token,
        selectedRepos,
        selectedDir,
      } = reactiveData.userConfigInfo

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
      toUploadImageCard_dom.value.uploadImage_all(reactiveData.userConfigInfo)
        .then((v: UploadStatusEnum) => {
          if (v === UploadStatusEnum.allUploaded || v === UploadStatusEnum.uploaded) {
            // 上传完成，清空状态
            reactiveData.imageLoading = false
            store.dispatch('TO_UPLOAD_IMAGE_CLEAN_URL')
          }
        })
        .catch((e: any) => {
          console.error('upload error: ', e);
          reactiveData.imageLoading = false
        })
    }

    const resetUploadInfo = () => {
      reactiveData.imageLoading = false
      store.dispatch('TO_UPLOAD_IMAGE_LOGOUT')
    }

    watch(() => reactiveData.logoutStatus, (_n, _o) => {
      if (!_n) { // 如果退出登录，清空信息
        resetUploadInfo()
      }
    })

    return {
      ...toRefs(reactiveData),
      GitHubExternalLinkInput,
      CDNExternalLinkInput,
      toUploadImageCard_dom,
      uploadArea_dom,
      resetUploadInfo,
      uploadImage
    }
  }


})
</script>

<style scoped lang="stylus">

@import "../style.styl"

.upload-page-container {
  width 100%
  height 100%
  display flex
  justify-content space-between


  .upload-page-left {
    height 100%
    box-sizing border-box
    margin-right $component-interval

    .uploaded-item {
      margin-bottom 20px

      &:last-child {
        margin-bottom 0
      }

    }
  }


  .upload-page-right {
    box-sizing border-box
    height 100%
    overflow-y auto

    .row-item {
      width 100%
      display flex
      justify-content center
      margin-bottom 16px
      box-sizing border-box

      &:last-child {
        margin-bottom 0
      }

      .content-box {
        width 100%
        max-width $content-max-width
        margin 0 auto
        box-sizing border-box
      }

    }

    .upload-status {
      position: relative;
      width: 100%;
      padding: 10px;
      background: $second-background-color;
      color: #666;
      font-size: 12px;
      box-sizing border-box

      .info-item {
        margin-top: 4px;
      }

      .file-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .upload-tips {

        display: flex;
        align-items: center;

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

        .el-input-group__append {
          width: 100px;
          text-align-last: justify;
        }
      }
    }


    .upload-tools {
      width: 100%;

      .repos-dir-info {
        margin-bottom 20px
        font-size 12px

        .repos-dir-info-item {
          margin-right 10px

          &:last-child {
            margin-right 0
          }
        }


      }
    }
  }

}
</style>
