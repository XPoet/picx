import type { ApiFailure } from '@/utils/request/types'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { uploadToManagementDirectory } from '@/services/management-actions'
import { refreshManagementDirectory } from '@/services/repository-content'
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
  const error = ref<ApiFailure | null>(null)
  const failed = computed(() => error.value !== null)
  const fetched = new Set<string>()
  let version = 0

  async function load(force = false) {
    const target = path.value
    const requestVersion = ++version
    error.value = null
    if (!force && fetched.has(target)) {
      loading.value = false
      return
    }
    loading.value = true
    const repository = { owner: config.value.owner, repo: config.value.repo, branch: config.value.branch }
    const current = () => requestVersion === version && config.value.logined && config.value.owner === repository.owner && config.value.repo === repository.repo && config.value.branch === repository.branch
    const result = await refreshManagementDirectory(repository, target, current)
    if (requestVersion !== version)
      return
    loading.value = false
    error.value = result.ok ? null : result.error
    if (result.ok)
      fetched.add(target)
  }

  function browse(target: string) {
    if (target !== path.value)
      picx.SET_USER_CONFIG_INFO({ viewDir: target })
  }

  const upload = (target = path.value) => uploadToManagementDirectory(target)

  watch(path, () => void load(), { immediate: true })
  onBeforeUnmount(() => {
    version += 1
  })
  return { path, directories, images, loading, failed, error, browse, upload, reload: () => load(true) }
}
