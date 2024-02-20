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
    <ul class="personal-center-popover border-box">
      <li class="user-info border-box" v-if="userConfigInfo.logined">
        <div class="info-item owner" v-if="userConfigInfo.owner">{{ userConfigInfo.owner }}</div>
        <div class="info-item name" v-if="userConfigInfo.email">{{ userConfigInfo.email }}</div>
      </li>
      <el-divider v-if="userConfigInfo.logined" style="margin: 5rem 0" />
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

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

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
