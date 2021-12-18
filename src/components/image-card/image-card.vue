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
      <img :src="imageObj.cdn_url" @click="imageView(imageObj)" />
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

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStore } from '@/store'
import axios from '@/common/utils/axios'
import { UploadedImageModel } from '@/common/model/upload.model'
import copyExternalLink from '@/components/copy-external-link/copy-external-link.vue'

// eslint-disable-next-line no-undef
const props = defineProps({
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
})

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)

const isShowDelBtn = ref(false)

const doDeleteImage = (imageObj: UploadedImageModel) => {
  // eslint-disable-next-line no-param-reassign
  imageObj.deleting = true
  const { owner, selectedRepos } = userConfigInfo.value

  axios
    .delete(`/repos/${owner}/${selectedRepos}/contents/${imageObj.path}`, {
      data: {
        owner,
        repo: selectedRepos,
        path: imageObj.path,
        message: '🗑️ Deleted Picture via PicX',
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
}

const deleteImageTips = (imageObj: UploadedImageModel) => {
  ElMessageBox.confirm(`此操作将会永久删除图片 ${imageObj.name} ？`, `删除提示`, {
    confirmButtonText: `确定`,
    cancelButtonText: `取消`,
    iconClass: `el-icon-warning`
  })
    .then(() => {
      doDeleteImage(imageObj)
    })
    .catch(() => {
      console.log('取消删除')
    })
}

const imageView = (imgObj: UploadedImageModel) => {
  store.commit('IMAGE_VIEWER', {
    isShow: true,
    imgInfo: {
      name: imgObj.name,
      size: imgObj.size,
      lastModified: imgObj.lastModified,
      url: imgObj.cdn_url
    }
  })
}
</script>

<style scoped lang="stylus">
@import 'image-card.styl';
</style>
