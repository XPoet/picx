<script setup lang="ts">
import type { PicxIconName } from '@/components/picx-icon/types'
import type { UploadDirectoryValue } from '@/utils/directory-utils'
import ElSegmented from 'element-plus/es/components/segmented/index'
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { NEW_DIR_COUNT_MAX } from '@/common/constant'
import { DirModeEnum } from '@/common/model/user-config'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import RepoDirCascader from '@/components/repo-dir-cascader/repo-dir-cascader.vue'
import { useRepositoryDirectories } from '@/composables/use-repository-directories'
import { useUploadDirectory } from '@/composables/use-upload-directory'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'
import 'element-plus/es/components/segmented/style/css'

const emit = defineEmits<{ saved: [value: UploadDirectoryValue], closed: [] }>()
const dialogOpen = defineModel<boolean>({ required: true })
const { draft, preview, validation, saveError, busy, saving, open, cancel, save } = useUploadDirectory()
const repository = computed(() => {
  const { owner, repo, branch } = store.getters.getUserConfigInfo
  return owner && repo && branch ? { owner, repo, branch } : null
})
const { loads, beginSession, endSession, loadChildren } = useRepositoryDirectories(repository)
const attempted = ref(false)
const newDirectoryInput = useTemplateRef<HTMLInputElement>('newDirectoryInput')
const modeGroup = useTemplateRef<HTMLElement>('modeGroup')
const modes: { value: DirModeEnum, label: string, icon: PicxIconName }[] = [
  { value: DirModeEnum.rootDir, label: 'config_page.root_dir', icon: 'folder-root' },
  { value: DirModeEnum.dateDir, label: 'config_page.date_dir', icon: 'calendar-days' },
  { value: DirModeEnum.repoDir, label: 'config_page.repo_dir', icon: 'folder-tree' },
  { value: DirModeEnum.newDir, label: 'config_page.create_new_dir', icon: 'folder-plus' },
]
const pathError = computed(() => attempted.value && !validation.value.ok ? validation.value.error : '')

function edited() {
  attempted.value = true
  saveError.value = null
}
function submit() {
  attempted.value = true
  const result = save()
  if (!result.ok) {
    if (result.field === 'inputPath')
      newDirectoryInput.value?.focus()
    return
  }
  emit('saved', result.value)
  dialogOpen.value = false
  ElMessage.success({ message: i18n.global.t('upload_directory.saved') })
}
function focusInitial() {
  if (draft.value.mode === DirModeEnum.newDir)
    newDirectoryInput.value?.focus()
  else modeGroup.value?.querySelector<HTMLInputElement>('input:checked')?.focus()
}
function editingShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && ['a', 's', 'd'].includes(event.key.toLowerCase()))
    event.stopPropagation()
}
watch(dialogOpen, (visible) => {
  if (visible) {
    open()
    attempted.value = false
    beginSession()
  }
  else {
    cancel()
    endSession()
  }
}, { immediate: true })
onBeforeUnmount(endSession)
</script>

<template>
  <el-dialog
    v-model="dialogOpen"
    class="upload-directory-dialog"
    :title="$t('upload_directory.title')"
    width="760px"
    align-center
    destroy-on-close
    @opened="focusInitial"
    @closed="emit('closed')"
  >
    <div class="directory-dialog-content" @paste.stop @keydown="editingShortcut">
      <div ref="modeGroup" class="directory-modes">
        <ElSegmented
          v-model="draft.mode"
          :options="modes"
          :disabled="busy"
          block
          @change="edited"
        >
          <template #default="{ item }">
            <span class="directory-mode-label">
              <PicxIcon :name="item.icon" :size="17" />{{ $t(item.label) }}
            </span>
          </template>
        </ElSegmented>
      </div>
      <div v-if="draft.mode === DirModeEnum.rootDir || draft.mode === DirModeEnum.dateDir" class="directory-mode-content">
        <p class="directory-field-label">
          {{ $t('upload_directory.target') }}
        </p>
        <output class="directory-readonly">{{ preview }}</output>
        <p class="directory-help">
          {{ $t(draft.mode === DirModeEnum.rootDir ? 'upload_directory.root_help' : 'upload_directory.date_help') }}
        </p>
      </div>
      <div v-else-if="draft.mode === DirModeEnum.repoDir" class="directory-mode-content">
        <RepoDirCascader
          v-model="draft.segments"
          controlled
          :loads="loads"
          :disabled="busy"
          @update:model-value="edited"
          @request-children="loadChildren($event)"
          @retry="loadChildren($event, true)"
        />
      </div>
      <div v-else class="directory-mode-content">
        <label class="directory-field-label" for="new-upload-directory">{{ $t('upload_directory.new_path') }}</label>
        <input
          id="new-upload-directory"
          ref="newDirectoryInput"
          v-model="draft.inputPath"
          class="new-directory-input"
          type="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          :disabled="busy"
          :placeholder="$t('upload_directory.placeholder')"
          :class="{ 'is-invalid': Boolean(pathError) }"
          @input="edited"
          @keydown.enter.prevent="submit"
        >
        <p id="directory-path-help" class="directory-help">
          {{ $t('upload_directory.new_help', { max: NEW_DIR_COUNT_MAX }) }}
        </p>
      </div>
      <p v-if="pathError" id="directory-path-error" class="directory-field-error" role="alert">
        {{ $t(`upload_directory.path_${pathError}`, { max: NEW_DIR_COUNT_MAX }) }}
      </p>
      <div class="directory-preview">
        <span>{{ $t('upload_directory.preview') }}</span>
        <strong data-testid="directory-preview">{{ preview || $t('upload_directory.incomplete') }}</strong>
      </div>
      <p v-if="saveError && saveError !== 'invalid-path'" class="directory-field-error" role="alert">
        {{ $t(`upload_directory.${saveError}`) }}
      </p>
      <p v-if="busy" class="directory-help" role="status">
        {{ $t('upload_directory.upload-busy') }}
      </p>
    </div>
    <template #footer>
      <el-button @click="dialogOpen = false">
        {{ $t('cancel') }}
      </el-button>
      <el-button type="primary" :disabled="busy" :loading="saving" @click="submit">
        {{ $t('upload_directory.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="stylus">
.upload-directory-dialog.el-dialog {
  display flex
  flex-direction column
  box-sizing border-box
  width unquote('min(760px, calc(100vw - 32px))')
  max-height calc(100dvh - 32px)
  margin auto
  padding 0
  border-radius var(--picx-radius-dialog)

  .el-dialog__header {
    flex-shrink 0
    margin 0
    padding 24px 72px 20px 28px

    .el-dialog__title {
      font-size 22px
      font-weight 600
      line-height 1.5
    }
  }

  .el-dialog__headerbtn {
    top 16px
    right 16px
    width 44px
    height 44px
  }

  .el-dialog__body {
    min-height 0
    padding 0 28px 24px
    overflow-y auto
    color var(--picx-color-text)
    font-size 14px
  }

  .el-dialog__footer {
    flex-shrink 0
    padding 20px 28px
    border-top 1px solid var(--picx-color-border)
  }

  .directory-modes {
    overflow-x auto

    .el-segmented {
      min-width max-content
      --el-segmented-item-height 44px
    }
  }

  .directory-mode-label {
    display flex
    align-items center
    justify-content center
    gap 8px
  }

  .directory-mode-content {
    margin 20px 0
  }

  .directory-field-label {
    display block
    margin 0 0 8px
    font-weight 500
  }

  .directory-readonly
  .new-directory-input {
    display block
    box-sizing border-box
    width 100%
    min-height 48px
    padding 12px 14px
    color var(--picx-color-text)
    font-size 14px
    line-height 1.5
    border-radius 10px
  }

  .directory-readonly {
    background var(--picx-color-bg)
  }

  .new-directory-input {
    background var(--picx-color-surface)
    border 1px solid var(--picx-color-control-border)

    &.is-invalid {
      border-color var(--picx-color-danger)
    }
  }

  .directory-help {
    margin 8px 0 0
    color var(--picx-color-text-muted)
    line-height 1.6
  }

  .directory-field-error {
    margin 12px 0
    color var(--picx-color-danger)
    line-height 1.6
  }

  .directory-preview {
    display flex
    flex-direction column
    gap 4px
    padding 14px 16px
    background var(--picx-color-bg)
    border-radius 10px

    span {
      color var(--picx-color-text-muted)
    }

    strong {
      overflow-wrap anywhere
      font-size 16px
      font-weight 500
      line-height 1.5
    }
  }

  @media (max-width 767px) {
    .el-dialog__header {
      padding-left 20px
    }

    .el-dialog__body {
      padding 0 20px 20px
    }

    .el-dialog__footer {
      padding 16px 20px
    }

    .new-directory-input {
      font-size 16px
    }
  }
}
</style>
