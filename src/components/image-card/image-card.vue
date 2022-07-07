<template>
  <div
    class="image-card"
    :class="{ listing: listing, checked: imageObj.checked }"
    v-loading="imageObj.deleting"
    element-loading-text="删除中..."
    @mouseenter="isShowDelBtn = true"
    @mouseleave="isShowDelBtn = false"
  >
    <div class="image-box">
      <img data-fancybox="gallery" :src="imgUrl" />
    </div>
    <div class="info-box">
      <div class="image-info">
        <el-input
          size="small"
          v-if="renameValue && props.modelValue === props.index"
          class="rename-input"
          v-model="renameValue"
          @blur="renameInputBlur"
          @keydown.enter.prevent="updateRename"
          ref="renameInputRef"
        ></el-input>
        <div class="filename" v-else>{{ imageObj.name }}</div>
        <div class="image-operation">
          <copy-external-link :img-obj="imageObj" />
        </div>
      </div>
    </div>

    <div
      class="operation-box"
      v-show="isShowDelBtn || dropdownVisible || imageObj.checked"
    >
      <div class="operation-left">
        <div
          v-if="isManagementPage"
          :class="[imageObj.checked ? 'picked-btn' : 'pick-btn', 'operation-btn']"
          @click="togglePick(imageObj)"
        >
          <el-icon v-if="imageObj.checked"><Check /></el-icon>
        </div>
      </div>
      <div class="operation-right">
        <el-dropdown size="default" trigger="click" @visible-change="visibleChange">
          <div class="operation-btn">
            <el-icon><MoreFilled /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="deleteImageTips(imageObj)">
                删除
              </el-dropdown-item>
              <el-dropdown-item @click.self="renameImage(imageObj)">
                重命名
              </el-dropdown-item>
              <el-dropdown-item @click="viewImageProperties(imageObj)">
                属性
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { ElInput } from 'element-plus'
import { useRoute } from 'vue-router'
import { useStore } from '@/store'
import axios from '@/utils/axios'
import { UploadedImageModel } from '@/common/model/upload.model'
import { getBase64ByImageUrl, getImage } from '@/utils/rename-image'
import { uploadImage_single } from '@/utils/upload-helper'
import { getFilename, getFileSize, getFileSuffix } from '@/utils/file-handle-helper'
import ExternalLinkType from '@/common/model/external-link.model'

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
const router = useRoute()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value
const isManagementPage = computed(() => {
  return router.path === '/management'
})

const imgUrl = computed(() => {
  switch (userSettings.externalLinkType) {
    case ExternalLinkType.jsdelivr:
      return props.imageObj.jsdelivr_cdn_url
    case ExternalLinkType.staticaly:
      return props.imageObj.staticaly_cdn_url
    case ExternalLinkType.cloudflare:
      return props.imageObj.cloudflare_cdn_url
    default:
      return props.imageObj.github_url
  }
})

const renameInputRef = ref<InstanceType<typeof ElInput>>()

const isShowDelBtn = ref(false)

const renameValue = ref('')

const dropdownVisible = ref<Boolean>(false)

const doDeleteImage = (
  imageObj: UploadedImageModel,
  isRename: boolean = false
): Promise<Boolean> => {
  if (!isRename) {
    // eslint-disable-next-line no-param-reassign
    imageObj.deleting = true
  }
  const { owner, selectedRepos } = userConfigInfo

  return new Promise((resolve) => {
    axios
      .delete(`/repos/${owner}/${selectedRepos}/contents/${imageObj.path}`, {
        data: {
          owner,
          repo: selectedRepos,
          path: imageObj.path,
          message: 'Delete picture via PicX(https://github.com/XPoet/picx)',
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
          store.dispatch('UPLOADED_LIST_REMOVE', imageObj.uuid)
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
  ElMessageBox.confirm(
    `
    <div>此操作将会永久删除图片：</div>
    <strong>${imageObj.name}</strong>
    `,
    `删除提示`,
    {
      dangerouslyUseHTMLString: true,
      type: 'warning'
    }
  )
    .then(() => {
      doDeleteImage(imageObj)
    })
    .catch(() => {
      console.log('取消删除')
    })
}

const togglePick = (imageObj: UploadedImageModel) => {
  // eslint-disable-next-line no-param-reassign
  imageObj.checked = !imageObj.checked
  store.commit('IMAGE_CARD', { imageObj })
}

const renameImage = async (imgObj: UploadedImageModel) => {
  emits('update:modelValue', props.index)
  renameValue.value = getFilename(imgObj.name)
  await nextTick(() => {
    const temp = setTimeout(() => {
      renameInputRef.value?.focus()
      clearTimeout(temp)
    }, 150)
  })
}

const renameInputBlur = () => {
  emits('update:modelValue', undefined)
}

const updateRename = async () => {
  renameInputBlur()

  const { imageObj }: any = props

  if (renameValue.value === getFilename(imageObj.name) || !renameValue.value) {
    return
  }

  const renameFn = async () => {
    const loading = ElLoading.service({
      lock: true,
      text: '正在重命名...'
    })

    const suffix = getFileSuffix(imageObj.name)

    const imgInfo = {
      name: renameValue.value + imageObj.name.substring(imageObj.name.indexOf('.')),
      size: imageObj.size,
      lastModified: Date.now(),
      type: `image/${suffix}`
    }

    const base64 = await getBase64ByImageUrl(imgUrl.value, suffix)

    if (base64) {
      const newImgObj = getImage(base64, imgInfo)
      if (newImgObj) {
        const isUploadSuccess = await uploadImage_single(userConfigInfo, newImgObj)

        if (isUploadSuccess) {
          renameValue.value = ''
          await doDeleteImage(imageObj, true)
          await store.dispatch('UPLOADED_LIST_REMOVE', newImgObj.uuid)
        }
      }
    }
    loading.close()
  }

  ElMessageBox.confirm(`该图片重命名为 ${renameValue.value} ？`, `提示`, {
    type: 'warning'
  })
    .then(async () => {
      await renameFn()
    })
    .catch(() => {
      console.log('取消图片重命名')
    })
}

const visibleChange = (e: boolean) => {
  dropdownVisible.value = e
}

const viewImageProperties = (imgObj: UploadedImageModel) => {
  ElMessageBox.confirm(
    `
    <div>图片名称：<strong>${imgObj.name}</strong></div>
    <div>图片大小：<strong>${getFileSize(imgObj.size)} KB</strong></div>
    `,
    `属性`,
    {
      showCancelButton: false,
      showConfirmButton: false,
      dangerouslyUseHTMLString: true,
      type: 'info'
    }
  )
}
</script>

<style scoped lang="stylus">
@import 'image-card.styl';
</style>
