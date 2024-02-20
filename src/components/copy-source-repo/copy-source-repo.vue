<template>
  <el-tooltip
    placement="top"
    :disabled="position !== 'management'"
    :content="$t('copy_repo_img.text_8')"
    :show-arrow="false"
    :offset="6"
  >
    <el-icon class="copy-source-repo-icon" :class="[position]" @click="dialogVisible = true">
      <IEpDocumentCopy />
    </el-icon>
  </el-tooltip>

  <el-dialog
    v-model="dialogVisible"
    width="500"
    :title="$t('copy_repo_img.text_1')"
    draggable
    :show-close="!loading"
    :close-on-click-modal="!loading"
    @close="closeDialog"
  >
    <div class="copy-source-repo border-box">
      <el-alert
        class="copy-result-tip"
        v-if="copyResult.text"
        :title="copyResult.text"
        :type="copyResult.status ? 'success' : 'error'"
        show-icon
        :closable="false"
      />

      <el-progress
        v-if="loading"
        class="copy-progress"
        :stroke-width="6"
        :percentage="50"
        :duration="2"
        :indeterminate="true"
        :show-text="false"
      />

      <el-form
        ref="formRef"
        label-width="90"
        label-position="left"
        :model="formObj"
        :disabled="loading"
      >
        <el-form-item
          :label="$t('repo')"
          prop="repo"
          :rules="[{ required: true, message: $t('copy_repo_img.text_2') }]"
        >
          <el-input ref="sourceRepoRef" v-model="formObj.repo" clearable />
        </el-form-item>

        <el-form-item
          :label="$t('branch')"
          prop="branch"
          :rules="[{ required: true, message: $t('copy_repo_img.text_3') }]"
        >
          <el-input ref="sourceRepoBranchRef" v-model="formObj.branch" clearable />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false" v-if="!loading">{{ $t('cancel') }}</el-button>
      <el-button type="primary" @click="onConfirm" :loading="loading" :disabled="copyResult.status">
        {{ loading ? $t('copy_repo_img.loading_1') : $t('confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import {
  getSourceRepoImgContent,
  refreshManagementPage,
  uploadSourceRepoImages
} from './copy-source-repo.util'
import i18n from '@/plugins/vue/i18n'

defineProps({
  position: {
    type: String as () => 'config' | 'management',
    default: 'config'
  }
})

const dialogVisible = ref(false)
const formRef = ref()
const sourceRepoRef = ref()
const sourceRepoBranchRef = ref()
const loading = ref(false)
const copyResult = reactive({
  status: false,
  text: ''
})

const formObj = reactive({
  repo: '',
  branch: ''
})

const onFocus = () => {
  if (!formObj.repo) {
    sourceRepoRef.value?.focus()
  } else if (!formObj.branch) {
    sourceRepoBranchRef.value?.focus()
  } else {
    sourceRepoRef.value?.focus()
  }
}

const onConfirm = async () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      await getSourceRepoImgContent(
        formObj.repo,
        formObj.branch,
        '',
        async ({ status, imgList }: any) => {
          if (status) {
            const copyRes = await uploadSourceRepoImages(imgList, formObj.repo)
            loading.value = false
            if (copyRes) {
              copyResult.status = true
              copyResult.text = i18n.global.t('copy_repo_img.text_6', { repo: formObj.repo })
              // 刷新 图床管理 页面
              await refreshManagementPage()
            } else {
              copyResult.status = false
              copyResult.text = i18n.global.t('copy_repo_img.text_7', { repo: formObj.repo })
            }
          } else {
            loading.value = false
            copyResult.status = false
            copyResult.text = i18n.global.t('copy_repo_img.text_4')
            onFocus()
          }
        }
      )
    } else {
      onFocus()
    }
  })
}

const closeDialog = () => {
  copyResult.status = false
  copyResult.text = ''
  formRef.value?.clearValidate()
}

watch(
  () => formObj,
  () => {
    copyResult.status = false
    copyResult.text = ''
  },
  { deep: true }
)

watch(
  () => dialogVisible.value,
  (nv) => {
    if (nv) {
      setTimeout(() => {
        onFocus()
      }, 100)
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="stylus">
@import "copy-source-repo.styl"
</style>
