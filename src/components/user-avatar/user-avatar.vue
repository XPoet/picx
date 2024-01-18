<template>
  <el-popover
    placement="right-end"
    trigger="click"
    width="220rem"
    :show-arrow="false"
    :popper-style="{
      padding: '0',
      'border-radius': '10rem',
      overflow: 'hidden'
    }"
  >
    <template #reference>
      <div
        class="user-avatar border-box"
        :class="{ folded: store.getters.getGlobalSettings.folded }"
      >
        <div class="left">
          <div class="avatar flex-center">
            <img
              :src="userConfigInfo?.avatarUrl"
              v-if="userConfigInfo?.avatarUrl"
              :alt="userConfigInfo?.owner"
            />
            <el-icon class="user-filled-icon" v-else><IEpUserFilled /></el-icon>
          </div>
          <div class="username" @click="jumpOwnerRepo">
            {{ userConfigInfo.owner ? userConfigInfo.owner : $t('header.not_login') }}
          </div>
        </div>

        <div class="right">
          <el-icon class="popover-tip-icon"><IEpCaretRight /></el-icon>
        </div>
      </div>
    </template>
    <ul class="personal-center-popover">
      <li class="content-item">
        <span class="flex-center">{{ $t('language') }}</span>
        <el-select size="small" style="width: 100rem" v-model="globalSettings.language">
          <el-option label="中文简体" :value="LanguageEnum.zhCN"></el-option>
          <el-option label="中文繁體" :value="LanguageEnum.zhTW"></el-option>
          <el-option label="English" :value="LanguageEnum.en"></el-option>
        </el-select>
      </li>
      <el-divider style="margin: 5rem 0" />
      <li class="content-item">
        <span class="flex-center">{{ $t('header.theme') }}</span>
        <el-select
          size="small"
          style="width: 100rem"
          v-model="userSettings.theme.mode"
          @change="persistUserSettings"
        >
          <el-option
            :label="$t('settings_page.theme.system')"
            :value="ThemeModeEnum.system"
          ></el-option>
          <el-option
            :label="$t('settings_page.theme.light')"
            :value="ThemeModeEnum.light"
          ></el-option>
          <el-option
            :label="$t('settings_page.theme.dark')"
            :value="ThemeModeEnum.dark"
          ></el-option>
        </el-select>
      </li>
      <el-divider style="margin: 5rem 0" />
      <li class="content-item" v-if="userConfigInfo.name || userConfigInfo.owner" @click="logout">
        {{ $t('logout') }}
      </li>
      <li class="content-item" v-else @click="router.push('/login')">
        {{ $t('login') }}
      </li>
    </ul>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores'
import { LanguageEnum, ThemeModeEnum } from '@/common/model'
import { getGitHubOwnerURL } from '@/utils'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

// 退出登录
const logout = () => {
  store.dispatch('LOGOUT')
  router.push('/login')
  document.body.click()
  setTimeout(() => {
    window.location.reload()
  })
}

const jumpOwnerRepo = () => {
  if (userConfigInfo.owner) {
    window.open(getGitHubOwnerURL(userConfigInfo))
  } else {
    router.push('/config')
  }
}
</script>

<style scoped lang="stylus">
@import "user-avatar.styl"
</style>
