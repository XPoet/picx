<template>
  <header class="header">
    <div class="header-left">
      <div class="brand" @click="router.push('/')">
        <div class="logo">
          <img src="../../assets/logo.png" alt="PicX" />
        </div>
        <div class="title">PicX</div>
      </div>
      <div class="website-count">
        <site-count :isuv="false" />
      </div>
    </div>

    <div class="header-right">
      <div class="user-info">
        <div class="username" @click="jumpOwnerRepo">
          {{ userConfigInfo.owner ? userConfigInfo.owner : $t('header.not_login') }}
        </div>

        <el-popover
          placement="bottom-end"
          trigger="click"
          width="220rem"
          :show-arrow="false"
          :popper-style="{
            padding: '0'
          }"
        >
          <template #reference>
            <div class="avatar-box">
              <div class="avatar flex-center">
                <img
                  :src="userConfigInfo?.avatarUrl"
                  v-if="userConfigInfo?.avatarUrl"
                  :alt="userConfigInfo?.owner"
                />
                <el-icon class="user-filled-icon" v-else><IEpUserFilled /></el-icon>
              </div>
              <el-icon class="caret-bottom-icon"><IEpCaretBottom /></el-icon>
            </div>
          </template>
          <ul class="personal-center-popover">
            <li class="content-item">
              <span class="flex-center">{{ $t('header.language') }}</span>
              <el-select
                size="small"
                style="width: 100rem"
                v-model="userSettings.language"
                @change="persistUserSettings"
              >
                <el-option label="中文简体" :value="LanguageEnum.zhCN"></el-option>
                <el-option label="中文繁體" :value="LanguageEnum.zhTW"></el-option>
                <el-option label="English" :value="LanguageEnum.en"></el-option>
              </el-select>
            </li>
            <el-divider style="margin: 5px 0" />
            <li class="content-item">
              <span class="flex-center">{{ $t('header.theme') }}</span>
              <el-select
                size="small"
                style="width: 100rem"
                v-model="userSettings.theme.mode"
                @change="persistUserSettings"
              >
                <el-option
                  :label="$t('settings.theme.system')"
                  :value="ThemeModeEnum.system"
                ></el-option>
                <el-option
                  :label="$t('settings.theme.light')"
                  :value="ThemeModeEnum.light"
                ></el-option>
                <el-option
                  :label="$t('settings.theme.dark')"
                  :value="ThemeModeEnum.dark"
                ></el-option>
              </el-select>
            </li>
            <el-divider style="margin: 5px 0" />
            <li
              class="content-item"
              v-if="userConfigInfo.name || userConfigInfo.owner"
              @click="logout"
            >
              {{ $t('header.logout') }}
            </li>
            <li class="content-item" v-else @click="router.push('/login')">
              {{ $t('header.login') }}
            </li>
          </ul>
        </el-popover>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores'
import { LanguageEnum, ThemeModeEnum } from '@/common/model'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value

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
    window.open(`https://github.com/${userConfigInfo.owner}/${userConfigInfo.selectedRepo}`)
  } else {
    router.push('/config')
  }
}
</script>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
