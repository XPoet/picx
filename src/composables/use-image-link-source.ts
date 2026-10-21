import { computed, ref } from 'vue'
import { ImageLinkTypeEnum } from '@/common/model'
import { deployment } from '@/components/deploy-status-bar/deploy-status-bar.util'
import { repositoryKey } from '@/services/github-deployment'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'

export function useImageLinkSource() {
  const store = usePicxStore(pinia)
  const settings = computed(() => store.getUserSettings)
  const checking = ref(false)
  const error = ref('')
  let selection = 0
  async function select(name: string) {
    const id = ++selection
    error.value = ''
    if (!Object.hasOwn(settings.value.imageLinkType.presetList, name))
      return
    if (name === ImageLinkTypeEnum.GitHubPages) {
      checking.value = true
      const target = store.getUserConfigInfo
      const key = repositoryKey(target)
      const result = await deployment.check()
      if (id !== selection)
        return
      checking.value = false
      if (result.phase !== 'available' || repositoryKey(result.target) !== key || repositoryKey(store.getUserConfigInfo) !== key) {
        error.value = result.phase === 'failed' ? `request_error.${result.error.kind}` : 'link_rules.pages-unavailable'
        return
      }
    }
    checking.value = false
    if (!store.SAVE_LINK_PREFERENCES({ ...settings.value.imageLinkType, selected: name }))
      error.value = 'link_rules.save-failed'
  }
  return { select, checking, error }
}
