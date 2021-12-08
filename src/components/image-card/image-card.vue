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
        <el-input
          v-if="renameValue && props.modelValue === props.index"
          class="rename-input"
          v-model="renameValue"
          @blur="updateRename"
          ref="renameInput"
        ></el-input>
        <div class="filename" v-else>{{ imageObj.name }}</div>
        <div class="image-operation">
          <copy-external-link :img-obj="imageObj" />
        </div>
      </div>
    </div>

    <div class="operation-box" v-show="isShowDelBtn || dropdownVisible">
      <el-tooltip content="查看大图" placement="top">
        <div class="btn" @click="imageView(imageObj)">
          <i class="el-icon-full-screen"></i>
        </div>
      </el-tooltip>

      <el-dropdown size="small" trigger="click" @visible-change="visibleChange">
        <div class="btn">
          <i class="el-icon-more"></i>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="deleteImageTips(imageObj)">
              删除图片
            </el-dropdown-item>
            <el-dropdown-item @click="renameImage(imageObj)">重命名</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, defineEmits, nextTick } from 'vue'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import type { ElInput } from 'element-plus'
import { useStore } from '@/store'
import axios from '@/common/utils/axios'
import { UploadedImageModel } from '@/common/model/upload.model'
import copyExternalLink from '@/components/copy-external-link/copy-external-link.vue'
import { getUrlBase64, getImage } from '@/common/utils/rename-image'
import { uploadImage_single } from '@/common/utils/upload-helper'

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
  },
  index: {
    type: Number
  },
  modelValue: {
    type: Number
  }
})

const emits = defineEmits(['update:modelValue'])

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)

const renameInput = ref<InstanceType<typeof ElInput>>()

const isShowDelBtn = ref(false)

const renameValue = ref('')

const toUploadImage = computed(() => store.getters.getToUploadImage).value

const dropdownVisible = ref<Boolean>(false)

const doDeleteImage = (
  imageObj: UploadedImageModel,
  isRename: boolean = false
): Promise<Boolean> => {
  if (!isRename) {
    // eslint-disable-next-line no-param-reassign
    imageObj.deleting = true
  }
  const { owner, selectedRepos } = userConfigInfo.value

  return new Promise((resolve) => {
    axios
      .delete(`/repos/${owner}/${selectedRepos}/contents/${imageObj.path}`, {
        data: {
          owner,
          repo: selectedRepos,
          path: imageObj.path,
          message: 'delete picture via PicX(https://github.com/XPoet/picx)',
          sha: imageObj.sha
        }
      })
      .then((res) => {
        console.log('[deleteImage] ', res)
        if (res && res.status === 200) {
          // eslint-disable-next-line no-param-reassign
          imageObj.deleting = false
          // eslint-disable-next-line no-unused-expressions
          ElMessage.success(`${isRename ? '更新' : '删除'}成功！`)
          store.dispatch('UPLOADED_LIST_REMOVE', imageObj)
          store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
          resolve(true)
        } else {
          // eslint-disable-next-line no-param-reassign
          imageObj.deleting = false
        }
      })
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

const renameImage = async (imgObj: UploadedImageModel) => {
  emits('update:modelValue', props.index)
  const splitIndex = imgObj.name.lastIndexOf('.')
  renameValue.value = imgObj.name.substr(0, splitIndex).trim().replace(/\s+/g, '-')
  await nextTick(() => {
    renameInput.value?.focus()
  })
}

const updateRename = async () => {
  emits('update:modelValue', undefined)
  const { imageObj } = props
  const imgExt = imageObj.name.split('.').pop()
  if (`${renameValue.value}.${imgExt}` === imageObj.name) return

  const loading = ElLoading.service({
    lock: true,
    text: '更新中...',
    background: 'rgba(0, 0, 0, 0.6)'
  })

  const imgInfo = {
    name: `${renameValue.value}.${imgExt}`,
    size: imageObj.size,
    lastModified: Date.now(),
    type: `image/${imgExt}`
  }

  const base64 = await getUrlBase64(imageObj.cdn_url, imgExt)
  if (base64) {
    const res = await getImage(base64, imgInfo)
    if (res) {
      renameValue.value = ''
      /**
       * @return isUploadSuccess 是否上传成功
       */
      const isUploadSuccess = await uploadImage_single(
        userConfigInfo.value,
        toUploadImage.list[0]
      )

      if (isUploadSuccess) {
        await doDeleteImage(imageObj, true)
        await store.dispatch('TO_UPLOAD_IMAGE_LIST_REMOVE', toUploadImage.list[0].uuid)
      }
    }
  }
  loading.close()
}

const visibleChange = (e: boolean) => {
  dropdownVisible.value = e
}
</script>

<style scoped lang="stylus">
@import 'image-card.styl';
</style>
