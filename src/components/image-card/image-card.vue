<template>
  <div
    class="image-card"
    :class="{ listing: listing }"
    v-loading="imageObj.deleting"
    element-loading-text="删除中..."
    element-loading-background="rgba(0, 0, 0, 0.6)"
    @mouseenter="isShowDelBtn = true"
    @mouseleave="isShowDelBtn = false"
  >
    <div class="image-box">
      <img :src="imageObj.cdn_url" />
    </div>
    <div class="info-box">
      <div class="image-info">
        <div class="filename">{{ imageObj.name }}</div>
        <div class="image-operation">
          <copy-external-link :img-obj="imageObj" />
        </div>
      </div>
    </div>
    <div class="operation-box" v-show="isShowDelBtn">
      <el-tooltip content="查看大图" placement="top">
        <div class="btn" @click="imageView(imageObj)">
          <i class="el-icon-full-screen"></i>
        </div>
      </el-tooltip>
      <el-tooltip content="删除图片" placement="top">
        <div class="btn" @click="deleteImageTips(imageObj)">
          <i class="el-icon-delete"></i>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, toRefs } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStore } from '@/store'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import axios from '@/common/utils/axios'
import { UploadedImageModel } from '@/common/model/upload.model'
import copyExternalLink from '@/components/copy-external-link/copy-external-link.vue'

export default defineComponent({
  name: 'image-card',

  components: {
    copyExternalLink
  },

  props: {
    listing: {
      type: Boolean,
      default: false
    },
    imageObj: {
      type: Object,
      default: () => {}
    },
    isUploaded: {
      type: Boolean,
      default: false
    }
  },

  setup() {
    const store = useStore()
    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo)
        .value,

      isShowDelBtn: false,

      deleteImageTips(imageObj: UploadedImageModel) {
        ElMessageBox.confirm(`此操作将会永久删除图片 ${imageObj.name} ？`, `删除提示`, {
          confirmButtonText: `确定`,
          cancelButtonText: `取消`,
          iconClass: `el-icon-warning`
        })
          .then(() => {
            this.doDeleteImage(imageObj)
          })
          .catch(() => {
            console.log('取消删除')
          })
      },

      doDeleteImage(imageObj: UploadedImageModel): void {
        // eslint-disable-next-line no-param-reassign
        imageObj.deleting = true
        const { owner, selectedRepos } = reactiveData.userConfigInfo

        axios
          .delete(`/repos/${owner}/${selectedRepos}/contents/${imageObj.path}`, {
            data: {
              owner,
              repo: selectedRepos,
              path: imageObj.path,
              message: 'delete pictures via PicX(https://github.com/XPoet/picx)',
              sha: imageObj.sha
            }
          })
          .then((res) => {
            console.log('[deleteImage] ', res)
            if (res && res.status === 200) {
              // eslint-disable-next-line no-param-reassign
              imageObj.deleting = false
              ElMessage.success('删除成功！')
              store.dispatch('UPLOADED_LIST_REMOVE', imageObj)
              store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
            } else {
              // eslint-disable-next-line no-param-reassign
              imageObj.deleting = false
            }
          })
      },

      imageView(imgObj: UploadedImageModel) {
        store.commit('IMAGE_VIEWER', {
          isShow: true,
          imgInfo: {
            name: imgObj.name,
            size: imgObj.size,
            lastModified: imgObj.lastModified,
            url: imgObj.cdn_url
          }
        })
      },

      imgMouseenter(e) {
        console.log('e --- ', e)
      },

      imgMouseleave(e) {
        console.log('e --- ', e)
      }
    })
    return {
      ...toRefs(reactiveData)
    }
  }
})
</script>

<style scoped lang="stylus">
@import 'image-card.styl';
</style>
