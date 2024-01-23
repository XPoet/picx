<template>
  <el-popover
    placement="bottom-end"
    trigger="click"
    width="240rem"
    :show-arrow="false"
    :popper-style="{
      padding: '0',
      'border-radius': '10rem',
      overflow: 'hidden'
    }"
  >
    <template #reference>
      <div
        class="user-avatar-v2 border-box"
        :class="{ folded: store.getters.getGlobalSettings.folded }"
      >
        <div class="avatar flex-center">
          <img
            :src="userConfigInfo?.avatarUrl"
            v-if="userConfigInfo?.avatarUrl"
            :alt="userConfigInfo?.owner"
          />
          <el-icon class="user-filled-icon" v-else><IEpUserFilled /></el-icon>
        </div>
        <el-icon class="popover-tip-icon"><IEpCaretBottom /></el-icon>
      </div>
    </template>
    <ul class="personal-center-popover border-box">
      <li class="user-info border-box" v-if="userConfigInfo.logined">
        <div class="info-item owner" v-if="userConfigInfo.owner">
          <el-link
            style="font-size: 16rem"
            :underline="false"
            :href="getGitHubOwnerURL(userConfigInfo)"
            target="_blank"
          >
            {{ userConfigInfo.owner }}
          </el-link>
        </div>
        <div class="info-item name" v-if="userConfigInfo.email">{{ userConfigInfo.email }}</div>
      </li>
      <el-divider v-if="userConfigInfo.logined" />
      <li class="content-item border-box">
        <span class="flex-center">{{ $t('language') }}</span>
        <el-select
          size="small"
          style="width: 100rem"
          v-model="globalSettings.language"
          @change="persistGlobalSettings"
        >
          <el-option label="中文简体" :value="LanguageEnum.zhCN"></el-option>
          <el-option label="中文繁體" :value="LanguageEnum.zhTW"></el-option>
          <el-option label="English" :value="LanguageEnum.en"></el-option>
        </el-select>
      </li>
      <el-divider />
      <li class="content-item border-box">
        <span class="flex-center">{{ $t('header.theme') }}</span>
        <el-select
          size="small"
          style="width: 100rem"
          v-model="globalSettings.theme"
          @change="persistGlobalSettings"
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
      <el-divider />
      <li
        class="content-item border-box"
        v-if="userConfigInfo.name || userConfigInfo.owner"
        @click="onLogout"
      >
        {{ $t('logout') }}
      </li>
      <li class="content-item border-box" v-else @click="onLogin">
        {{ $t('login') }}
      </li>
    </ul>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores'
import { getGitHubOwnerURL } from '@/utils'
import { LanguageEnum, ThemeModeEnum } from '@/common/model'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value

const onLogin = () => {
  router.push('/login')
  document.body.click()
}

// 退出登录
const onLogout = () => {
  store.dispatch('LOGOUT')
  router.push('/login')
  document.body.click()
  setTimeout(() => {
    window.location.reload()
  })
}

const persistGlobalSettings = () => {
  store.dispatch('USER_GLOBAL_PERSIST')
}
</script>

<style scoped lang="stylus">
@import "user-avatar-v2.styl"
</style>
