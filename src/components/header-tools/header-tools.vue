<script setup lang="ts">
import type { PicxIconName } from '@/components/picx-icon/types'
import { computed } from 'vue'
import { LanguageEnum, ThemeModeEnum } from '@/common/model'
import HeaderMenu from '@/components/header-menu/header-menu.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import SiteAnnouncement from '@/components/site-announcement/site-announcement.vue'
import UserAvatarV2 from '@/components/user-avatar-v2/user-avatar-v2.vue'
import { usePwaInstall } from '@/composables/use-pwa-install'
import { useStore } from '@/stores'

const store = useStore()
const settings = computed(() => store.getters.getGlobalSettings)
const { canInstall, installing, install } = usePwaInstall()
const languages = [LanguageEnum.zhCN, LanguageEnum.zhTW, LanguageEnum.en]
const themes: { value: ThemeModeEnum, icon: PicxIconName }[] = [
  { value: ThemeModeEnum.system, icon: 'monitor' },
  { value: ThemeModeEnum.light, icon: 'sun' },
  { value: ThemeModeEnum.dark, icon: 'moon' },
]
const themeIcon = computed(() => themes.find(theme => theme.value === settings.value.theme)?.icon ?? 'monitor')
</script>

<template>
  <HeaderMenu :label="$t('header.choose_language')" icon="globe">
    <template #default="{ close }">
      <button
        v-for="language in languages"
        :key="language"
        role="menuitemradio"
        type="button"
        :aria-checked="settings.language === language"
        @click="store.dispatch('SET_GLOBAL_SETTINGS', { language }); close()"
      >
        {{ $t(`languages.${language}`) }}
      </button>
    </template>
  </HeaderMenu>
  <HeaderMenu :label="$t('header.theme')" :icon="themeIcon">
    <template #default="{ close }">
      <button
        v-for="theme in themes"
        :key="theme.value"
        role="menuitemradio"
        type="button"
        :aria-checked="settings.theme === theme.value"
        @click="store.dispatch('SET_GLOBAL_SETTINGS', { theme: theme.value }); close()"
      >
        <PicxIcon :name="theme.icon" />
        {{ $t(`settings_page.theme.${theme.value}`) }}
      </button>
    </template>
  </HeaderMenu>
  <SiteAnnouncement />
  <UserAvatarV2 :can-install="canInstall" :installing="installing" @install="install" />
</template>
