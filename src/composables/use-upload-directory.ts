import type { DirectorySaveResult, UploadDirectoryDraft } from '@/utils/directory-utils'
import { computed, ref } from 'vue'
import { DirModeEnum } from '@/common/model/user-config'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { directoryDraft, displayDirectory, localDateDirectory, validateDirectoryDraft } from '@/utils/directory-utils'

/** 草稿不共享已保存数组；所有关闭路径仅作废草稿。 */
export function useUploadDirectory(now: () => Date = () => new Date()) {
  const store = usePicxStore(pinia)
  const visible = ref(false)
  const saving = ref(false)
  const draft = ref<UploadDirectoryDraft>({ mode: DirModeEnum.rootDir, segments: [], inputPath: '' })
  const resolvedAt = ref(now())
  const saveError = ref<Exclude<DirectorySaveResult, { ok: true }>['reason'] | null>(null)
  const validation = computed(() => validateDirectoryDraft(draft.value, resolvedAt.value))
  const preview = computed(() => validation.value.ok ? displayDirectory(validation.value.value.selectedDir) : '')
  const busy = computed(() => store.uploadTargetBusy || store.getUploadImageList.some(image => image.uploadStatus.uploading))

  function open() {
    resolvedAt.value = now()
    draft.value = directoryDraft(store.getUserConfigInfo)
    if (draft.value.mode === DirModeEnum.dateDir)
      draft.value.inputPath = localDateDirectory(resolvedAt.value)
    visible.value = true
    saveError.value = null
  }

  function cancel() {
    visible.value = false
    draft.value = { mode: DirModeEnum.rootDir, segments: [], inputPath: '' }
    saveError.value = null
  }

  function save(): DirectorySaveResult {
    if (!visible.value)
      return { ok: false, reason: 'invalid-path' }
    if (busy.value) {
      saveError.value = 'upload-busy'
      return { ok: false, reason: 'upload-busy' }
    }
    resolvedAt.value = now()
    const result = validateDirectoryDraft(draft.value, resolvedAt.value)
    if (!result.ok) {
      saveError.value = 'invalid-path'
      return { ok: false, reason: 'invalid-path', field: result.field }
    }
    if (draft.value.mode === DirModeEnum.newDir || draft.value.mode === DirModeEnum.dateDir) {
      draft.value.inputPath = result.value.selectedDir
    }
    saving.value = true
    try {
      const saved = store.SAVE_UPLOAD_DIRECTORY(result.value)
      if (saved.ok)
        visible.value = false
      else saveError.value = saved.reason
      return saved
    }
    finally {
      saving.value = false
    }
  }

  return { visible, saving, draft, preview, validation, saveError, busy, open, cancel, save }
}
