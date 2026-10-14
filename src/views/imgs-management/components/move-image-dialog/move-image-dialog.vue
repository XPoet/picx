<script setup lang="ts">
import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { computed, ref, watch } from 'vue'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'
import { moveImageOnGitHub } from '@/utils/repo-content-utils'

interface DirTreeNode {
  value: string
  label: string
  disabled?: boolean
  children: DirTreeNode[]
}

const uploadAreaState = computed(() => store.getters.getUploadAreaState)
const dirObject = computed(() => store.getters.getDirObject)

const dialogVisible = ref(false)
const moving = ref(false)
const movingImg = ref<UploadedImageModel | null>(null)
const targetDir = ref('')

// 右键菜单指令通过 store 打开弹窗
watch(
  () => uploadAreaState.value.isShowMoveImageDialog,
  (nv) => {
    if (!nv) {
      return
    }

    movingImg.value = uploadAreaState.value.moveImageInfo ?? null
    targetDir.value = ''
    dialogVisible.value = true
    store.commit('SET_UPLOAD_AREA_STATE', { isShowMoveImageDialog: false })
  },
)

// 从本地目录树构建选择器数据（图片当前所在目录禁用）
const buildTreeData = (dirObj: DirObject, currentDir: string): DirTreeNode[] => {
  return dirObj.childrenDirs.map(childDir => ({
    value: childDir.dirPath,
    label: childDir.dir,
    disabled: childDir.dirPath === currentDir,
    children: buildTreeData(childDir, currentDir),
  }))
}

const dirTreeData = computed<DirTreeNode[]>(() => {
  const currentDir = movingImg.value?.dir ?? ''
  return [
    {
      value: '/',
      label: i18n.global.t('management_page.contextmenu_3'),
      disabled: currentDir === '/',
      children: buildTreeData(dirObject.value, currentDir),
    },
  ]
})

const closeDialog = () => {
  dialogVisible.value = false
  moving.value = false
  movingImg.value = null
  store.commit('SET_UPLOAD_AREA_STATE', { moveImageInfo: null })
}

const onConfirm = async () => {
  const img = movingImg.value
  if (!img || !targetDir.value) {
    return
  }

  moving.value = true

  const userConfigInfo = store.getters.getUserConfigInfo
  const res = await moveImageOnGitHub(userConfigInfo, img, targetDir.value)

  moving.value = false

  if (res) {
    ElMessage.success(i18n.global.t('management_page.message8'))
    closeDialog()
  }
  else {
    ElMessage.error(i18n.global.t('management_page.message9'))
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    class="move-image-dialog"
    width="min(460px, 92vw)"
    :title="$t('move')"
    draggable
    align-center
    :show-close="!moving"
    :close-on-click-modal="!moving"
    :close-on-press-escape="!moving"
    @close="closeDialog"
  >
    <div class="move-image-content border-box">
      <div class="image-name text-ellipsis" :title="movingImg?.name">
        {{ movingImg?.name }}
      </div>
      <el-tree-select
        v-model="targetDir"
        :data="dirTreeData"
        :placeholder="$t('management_page.moveTips')"
        :disabled="moving"
        filterable
        default-expand-all
        :render-after-expand="false"
        check-strictly
      />
    </div>
    <template #footer>
      <el-button v-if="!moving" @click="closeDialog">
        {{ $t('cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="moving"
        :disabled="!targetDir"
        @click="onConfirm"
      >
        {{ moving ? $t('management_page.loadingTxt4') : $t('confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="stylus">
.move-image-content {
  .image-name {
    margin-bottom 12rem
    color var(--el-text-color-secondary)
    font-size 13rem
  }
}
</style>
