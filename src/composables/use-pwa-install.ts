import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isInstallPrompt = (event: Event): event is InstallPromptEvent =>
  'prompt' in event && typeof event.prompt === 'function' && 'userChoice' in event

export function usePwaInstall() {
  const { t } = useI18n()
  const prompt = shallowRef<InstallPromptEvent>()
  const installing = ref(false)
  const onPrompt = (event: Event) => {
    if (isInstallPrompt(event)) {
      event.preventDefault()
      prompt.value = event
    }
  }
  const onInstalled = () => {
    prompt.value = undefined
  }

  const install = async () => {
    if (!prompt.value || installing.value) {
      return
    }
    const pending = prompt.value
    installing.value = true
    try {
      await pending.prompt()
      await pending.userChoice
      prompt.value = undefined
    }
    catch {
      prompt.value = undefined
      ElMessage.warning(t('header.install_failed'))
    }
    finally {
      installing.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
  })
  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  })

  return { canInstall: computed(() => Boolean(prompt.value)), installing, install }
}
