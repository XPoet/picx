<template>
  <div
    class="image-card"
    :class="{ checked: imageObj.checked }"
    v-loading="imageObj.deleting"
    :element-loading-text="$t('management.loadingTxt3')"
    @mouseenter="isShowOperateBtn = true"
    @mouseleave="isShowOperateBtn = false"
  >
    <div class="image-box">
      <el-image
        :src="imgUrl"
        fit="cover"
        loading="lazy"
        lazy
        :hide-on-click-modal="true"
        :preview-src-list="[imgUrl]"
      />
    </div>

    <div class="info-box">
      <div class="image-info">
        <!-- 重命名操作 -->
        <div class="rename-operate" v-if="isRenameImg">
          <el-input
            size="small"
            class="rename-input"
            v-model="renameInputValue"
            clearable
            ref="renameInputRef"
            :maxlength="RENAME_MAX_LENGTH"
          ></el-input>
          <el-button-group size="small">
            <el-button @click="isRenameImg = false"><IEpClose /></el-button>
            <el-button @click.prevent="updateRename"><IEpCheck /></el-button>
          </el-button-group>
        </div>
        <!-- 文件名 -->
        <div class="filename" v-else>{{ imageObj.name }}</div>
      </div>
    </div>

    <!-- 图片链接操作 -->
    <div class="copy-link-box border-box">
      <copy-image-link :img-obj="imageObj" />
    </div>

    <div class="operation-box" v-show="isShowOperateBtn || dropdownVisible || imageObj.checked">
      <div class="operation-left">
        <div
          v-if="isManagementPage"
          :class="[imageObj.checked ? 'picked-btn' : 'pick-btn', 'operation-btn']"
          @click="togglePick(imageObj)"
        >
          <el-icon v-if="imageObj.checked"><IEpCheck /></el-icon>
        </div>
      </div>
      <div class="operation-right">
        <el-dropdown size="default" trigger="click" @visible-change="visibleChange">
          <div class="operation-btn">
            <el-icon><IEpMoreFilled /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="deleteImageTips(imageObj)">
                {{ $t('upload.delete') }}
              </el-dropdown-item>
              <el-dropdown-item @click.self="showRenameInput(imageObj)">
                {{ $t('upload.rename') }}
              </el-dropdown-item>
              <el-dropdown-item @click="viewImageProperties(imageObj)">
                {{ $t('management.property') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import type { ElInput } from 'element-plus'
import { useRoute } from 'vue-router'
import { useStore } from '@/stores'
import { UploadedImageModel, UploadImageModel } from '@/common/model'
import {
  getBase64ByImageUrl,
  getFilename,
  getFileSize,
  generateImageLinks,
  getUuid,
  createUploadImageObject,
  getFileSuffix,
  blobToBase64ByImageUrl
} from '@/utils'
import { uploadImageToGitHub } from '@/utils/upload-utils'
import { deleteSingleImage } from '@/common/api'
import { RENAME_MAX_LENGTH } from '@/common/constant'

const props = defineProps({
  imageObj: {
    type: Object as () => UploadedImageModel,
    default: () => ({})
  },
  isUploaded: {
    type: Boolean,
    default: false
  }
})

const instance = getCurrentInstance()

const store = useStore()
const router = useRoute()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value
const isManagementPage = computed(() => {
  return router.path === '/management'
})

const imgUrl = computed(() => generateImageLinks(props.imageObj, userConfigInfo, userSettings))

const renameInputRef = ref<InstanceType<typeof ElInput>>()
const renameInputValue = ref<string>('')
const isRenameImg = ref<boolean>(false)

const isShowOperateBtn = ref<boolean>(false)
const dropdownVisible = ref<boolean>(false)

const deleteOriginImage = (
  imageObj: UploadedImageModel,
  isRename: boolean = false
): Promise<boolean> => {
  if (!isRename) {
    imageObj.deleting = true
  }
  const { owner, selectedRepo: repo } = userConfigInfo
  const { path, sha } = imageObj

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const res = await deleteSingleImage(owner, repo, path, sha)
    if (res) {
      if (isRename) {
        isRenameImg.value = false
        ElMessage.success({ message: instance?.proxy?.$t('management.message4') })
      } else {
        ElMessage.success({ message: instance?.proxy?.$t('management.message5') })
      }
      await store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
      await store.dispatch('UPLOAD_IMG_LIST_REMOVE', imageObj.uuid)
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

const deleteImageTips = (imageObj: UploadedImageModel) => {
  ElMessageBox.confirm(
    `
    <div>${instance?.proxy?.$t('management.delTips')}：</div>
    <strong>${imageObj.name}</strong>
    `,
    instance?.proxy?.$t('tips'),
    {
      dangerouslyUseHTMLString: true,
      type: 'warning'
    }
  )
    .then(() => {
      deleteOriginImage(imageObj)
    })
    .catch(() => {
      console.log('Cancel')
    })
}

const togglePick = (imageObj: UploadedImageModel) => {
  imageObj.checked = !imageObj.checked
  store.commit('IMAGE_CARD', { imageObj })
}

/**
 * 显示重命名输入框和确定按钮
 * @param imgObj
 */
const showRenameInput = async (imgObj: UploadedImageModel) => {
  isRenameImg.value = true
  renameInputValue.value = getFilename(imgObj.name)
  setTimeout(() => {
    renameInputRef.value?.focus()
  }, 100)
}

const updateRename = async () => {
  const { imageObj } = props

  if (!renameInputValue.value) {
    ElMessage.error({ message: instance?.proxy?.$t('management.message1') })
    renameInputRef.value?.focus()
    return
  }

  if (renameInputValue.value === getFilename(imageObj.name)) {
    ElMessage.error({ message: instance?.proxy?.$t('management.message2') })
    isRenameImg.value = false
    return
  }

  const renameImg = async () => {
    const loading = ElLoading.service({
      lock: true,
      text: instance?.proxy?.$t('management.loadingTxt2')
    })

    // 重命名的逻辑是先上传一张新名称的图片，再删除旧图片

    const suffix = getFileSuffix(imageObj.name)
    const newUuid = getUuid()
    const newFilename = `${renameInputValue.value}${
      userSettings.imageName.autoAddHash ? `.${newUuid}` : ''
    }.${suffix}`

    let base64

    if (!suffix.includes('svg')) {
      base64 = await getBase64ByImageUrl(imgUrl.value || '', suffix)
    } else {
      base64 = await blobToBase64ByImageUrl(imgUrl.value || '')
    }

    if (base64) {
      const tmpImgObj: UploadImageModel = createUploadImageObject()
      tmpImgObj.uuid = newUuid
      tmpImgObj.base64.originalBase64 = base64
      tmpImgObj.filename.final = newFilename
      tmpImgObj.reUploadInfo!.isReUpload = true
      tmpImgObj.reUploadInfo!.dir = imageObj.dir
      let path = newFilename
      if (imageObj.dir !== '/') {
        path = `${imageObj.dir}/${newFilename}`
      }
      tmpImgObj.reUploadInfo!.path = path

      // 重新上传重命名后的图片
      const isUploadSuccess = await uploadImageToGitHub(userConfigInfo, tmpImgObj)

      if (isUploadSuccess) {
        renameInputValue.value = ''
        await deleteOriginImage(imageObj, true)
        await store.dispatch('UPLOAD_IMG_LIST_REMOVE', imageObj.uuid)
      } else {
        ElMessage.error({ message: instance?.proxy?.$t('management.message3') })
      }
    } else {
      ElMessage.error({ message: instance?.proxy?.$t('management.message3') })
    }
    loading.close()
    isRenameImg.value = false
  }

  ElMessageBox.confirm(
    instance?.proxy?.$t('management.renameTips', { name: renameInputValue.value }),
    instance?.proxy?.$t('tips'),
    {
      type: 'info'
    }
  )
    .then(() => {
      renameImg()
    })
    .catch(() => {
      console.log('Cancel')
      isRenameImg.value = false
    })
}

const visibleChange = (e: boolean) => {
  dropdownVisible.value = e
}

/**
 * 查看图片属性
 * @param imgObj
 */
const viewImageProperties = (imgObj: UploadedImageModel) => {
  ElMessageBox.confirm(
    `
    <div>${instance?.proxy?.$t('management.imageName')}：<strong>${imgObj.name}</strong></div>
    <div>${instance?.proxy?.$t('management.imageSize')}：<strong>${getFileSize(
      imgObj.size
    )} KB</strong></div>
    `,
    instance?.proxy?.$t('management.property'),
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
