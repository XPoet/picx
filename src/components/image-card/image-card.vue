<template>
  <div
    class="image-card"
    :class="{ listing: listing }"
    v-loading="imageObj.deleting"
    element-loading-text="删除中..."
    element-loading-background="rgba(0, 0, 0, 0.6)"
  >
    <div class="image-box">
      <img :src="imageObj.cdn_url" @click="imageView(imageObj)" />
    </div>
    <div class="info-box">
      <div class="image-info">
        <div class="filename">{{ imageObj.name }}</div>
        <div class="image-operation">
          <div class="delete">
            <el-tooltip content="删除" placement="top">
              <i class="el-icon-delete" @click="deleteImage(imageObj)"></i>
            </el-tooltip>
          </div>

          <div>
            <copy-external-link :img-obj="imageObj" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, toRefs } from 'vue'
import { useStore } from '@/store'
import { ElMessage, ElMessageBox } from 'element-plus'
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
      isEnableDeleted: true,
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,

      deleteImage(imageObj: UploadedImageModel) {
        ElMessageBox.confirm(`此操作将会永久删除 ${imageObj.name} ？`, `删除提示`, {
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

        axios
          .delete(
            `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents/${imageObj.path}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `token ${this.userConfigInfo?.token}`
              },
              data: {
                owner: this.userConfigInfo?.owner,
                repo: this.userConfigInfo?.selectedRepos,
                path: imageObj.path,
                message: 'delete pictures via PicX(https://github.com/XPoet/picx)',
                sha: imageObj.sha
              }
            }
          )
          .then((res) => {
            console.log('delete res: ', res)
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

      imageView(imgObj: any) {
        store.commit('IMAGE_VIEWER', {
          isShow: true,
          url: imgObj.cdn_url
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
@import 'image-card.styl';
</style>
