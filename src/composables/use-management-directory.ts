import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { DirModeEnum } from '@/common/model'
import i18n from '@/plugins/vue/i18n'
import router from '@/router'
import { loadRepositoryContent } from '@/services/repository-content'
import { pinia, store } from '@/stores'
import { getDirContent } from '@/stores/modules/dir-image-list/utils'
import { usePicxStore } from '@/stores/picx-store'

export function useManagementDirectory() {
  const picx = usePicxStore(pinia)
  const config = computed(() => store.getters.getUserConfigInfo)
  if (!config.value.viewDir) {
    const saved = config.value.selectedDir
    picx.SET_USER_CONFIG_INFO({ viewDir: saved && getDirContent(saved, picx.getDirObject) ? saved : '/' })
  }
  const path = computed(() => config.value.viewDir || '/')
  const directory = computed(() => getDirContent(path.value, picx.getDirObject))
  const directories = computed(() => directory.value?.childrenDirs ?? [])
  const images = computed(() => directory.value?.imageList ?? [])
  const loading = ref(false)
  const failed = ref(false)
  const fetched = new Set<string>()
  let version = 0

  async function load(force = false) {
    const target = path.value
    const requestVersion = ++version
    failed.value = false
    if (!force && (fetched.has(target) || directories.value.length || images.value.length)) {
      loading.value = false
      return
    }
    loading.value = true
    const result = await loadRepositoryContent(config.value, target)
    if (requestVersion !== version)
      return
    loading.value = false
    failed.value = !result
    if (result)
      fetched.add(target)
  }

  function browse(target: string) {
    if (target !== path.value)
      picx.SET_USER_CONFIG_INFO({ viewDir: target })
  }

  async function upload(target = path.value) {
    const result = picx.SAVE_UPLOAD_DIRECTORY({
      dirMode: target === '/' ? DirModeEnum.rootDir : DirModeEnum.repoDir,
      selectedDir: target,
      selectedDirList: target === '/' ? [] : target.split('/'),
    })
    if (!result.ok) {
      ElMessage.error(i18n.global.t(`management_page.workspace.${result.reason === 'upload-busy' ? 'uploadBusy' : 'uploadSaveFailed'}`))
      return
    }
    await router.push('/upload')
  }

  watch(path, () => void load(), { immediate: true })
  onBeforeUnmount(() => {
    version += 1
  })
  return { path, directories, images, loading, failed, browse, upload, reload: () => load(true) }
}
