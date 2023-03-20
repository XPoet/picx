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
          <copy-image-link :img-obj="imageObj" />
        </div>
      </div>
    </div>

    <div class="operation-box" v-show="isShowDelBtn || dropdownVisible || imageObj.checked">
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
              <el-dropdown-item @click="deleteImageTips(imageObj)"> 删除 </el-dropdown-item>
              <el-dropdown-item @click.self="renameImage(imageObj)"> 重命名 </el-dropdown-item>
              <el-dropdown-item @click="viewImageProperties(imageObj)"> 属性 </el-dropdown-item>
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
import { UploadedImageModel } from '@/common/model'
import {
  getBase64ByImageUrl,
  getFilename,
  getFileSize,
  generateImageLinks,
  createToUploadImageObject,
  filenameHandle,
  getUuid
} from '@/utils'
import { uploadImageToGitHub } from '@/utils/upload-utils'
import { deleteSingleImage } from '@/common/api'

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

const imgUrl = computed(() =>
  generateImageLinks(props.imageObj as UploadedImageModel, userConfigInfo, userSettings)
)

const renameInputRef = ref<InstanceType<typeof ElInput>>()

const isShowDelBtn = ref(false)

const renameValue = ref('')

const dropdownVisible = ref<Boolean>(false)

const deleteOriginImage = (
  imageObj: UploadedImageModel,
  isRename: boolean = false
): Promise<Boolean> => {
  if (!isRename) {
    imageObj.deleting = true
  }
  const { owner, selectedRepo: repo } = userConfigInfo
  const { path, sha } = imageObj

  return new Promise((resolve) => {
    deleteSingleImage(owner, repo, path, sha, (res: any) => {
      imageObj.deleting = false
      if (res) {
        ElMessage.success(`${isRename ? '更新' : '删除'}成功！`)
        store.dispatch('UPLOADED_LIST_REMOVE', imageObj.uuid)
        store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
        resolve(true)
      } else {
        resolve(false)
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
      deleteOriginImage(imageObj)
    })
    .catch(() => {
      console.log('取消删除')
    })
}

const togglePick = (imageObj: UploadedImageModel) => {
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

  const renameImg = async () => {
    const loading = ElLoading.service({
      lock: true,
      text: '正在重命名...'
    })

    const { suffix } = filenameHandle(imageObj.name)
    const newUuid = getUuid()
    const newFilename = `${renameValue.value}.${newUuid}.${suffix}`
    const base64 = await getBase64ByImageUrl(imgUrl.value || '', suffix)

    // eslint-disable-next-line no-unreachable
    if (base64) {
      const toUpdateImgObj = createToUploadImageObject()
      toUpdateImgObj.uuid = newUuid
      toUpdateImgObj.imgData.base64Content = base64.split(',')[1] as string
      toUpdateImgObj.filename.final = newFilename
      toUpdateImgObj.reUploadImgPath = `${imageObj.dir}/${newFilename}`
      toUpdateImgObj.reUploadInfo.isReUpload = true
      toUpdateImgObj.reUploadInfo.dir = imageObj.dir
      let path = newFilename
      if (imageObj.dir !== '/') {
        path = `${imageObj.dir}/${newFilename}`
      }
      toUpdateImgObj.reUploadInfo.path = path

      // 重新上传重命名后的图片
      const isUploadSuccess = await uploadImageToGitHub(userConfigInfo, toUpdateImgObj)

      if (isUploadSuccess) {
        renameValue.value = ''
        await deleteOriginImage(imageObj, true)
        await store.dispatch('UPLOADED_LIST_REMOVE', imageObj.uuid)
      } else {
        ElMessage.error('重命名失败')
      }
    } else {
      ElMessage.error('重命名失败')
    }
    loading.close()
  }

  ElMessageBox.confirm(`该图片重命名为 ${renameValue.value} ？`, `提示`, {
    type: 'warning'
  })
    .then(async () => {
      await renameImg()
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
@import 'image-card.styl'
</style>
