<template>
  <div class="image-card"
       v-loading="imageObj.deleting"
       element-loading-text="删除中..."
       element-loading-background="rgba(0, 0, 0, 0.6)"
  >
    <div class="image-box">
      <img :src="imageObj.cdn_url"
           @click="imageView(imageObj)"
      >
    </div>
    <div class="info-box">
      <div class="image-info">
        <div class="filename">{{ imageObj.name }}</div>
        <div class="image-operation">
          <div class="delete">
            <el-tooltip content="删除" placement="top">
              <i class="el-icon-delete"
                 @click="deleteImage(imageObj)"
              ></i>
            </el-tooltip>
          </div>

          <div>
            <copyExternalLink :img-obj="imageObj"></copyExternalLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, toRefs } from 'vue'
import { useStore } from "vuex";
import axios from '../common/utils/axios/index'
import { ElMessage } from 'element-plus'
import { UserConfigInfoModel } from '../common/model/userConfigInfo.model'
import copyExternalLink from './copy-external-link.vue'

export default defineComponent({
  name: "ImageCard",

  components: {
    copyExternalLink
  },

  props: {
    imageObj: {
      type: Object,
      default: () => {
      }
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


      deleteImage(imageObj: any) {

        imageObj.deleting = true

        axios.delete(
          `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents/${imageObj.path}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo?.token}`
            },
            data: {
              owner: this.userConfigInfo?.owner,
              repo: this.userConfigInfo?.selectedRepos,
              path: imageObj.path,
              message: 'delete pictures via PicX(https://github.com/XPoet/picx)',
              sha: imageObj.sha
            }
          }
        ).then(res => {
          console.log('delete res: ', res);
          if (res && res.status === 200) {
            imageObj.deleting = false
            ElMessage.success('删除成功！')
            store.dispatch('UPLOADED_LIST_REMOVE', imageObj)
            store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
          } else {
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

  },
})
</script>

<style scoped lang="stylus">

@import "../style.styl";

$infoBoxHeight = 56px;

.image-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-shadow: 1px 2px 3px $image-card-shadow-color;
  box-sizing: border-box;
  padding-bottom: $infoBoxHeight;

  .image-box {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

  }


  .info-box {
    width: 100%;
    height: $infoBoxHeight;
    position: absolute;
    bottom: 0;
    left: 0;

    .image-info {
      width: 100%;
      height: 100%;
      padding: 5px;
      color: $default-font-color;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .filename {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
      }

      .image-operation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 5px;

        .delete {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;

          i {
            font-size: 16px;
          }

        }

      }
    }
  }

}
</style>
