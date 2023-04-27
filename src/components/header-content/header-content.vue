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
      <div class="user-info" @click="onUserInfoClick">
        <div class="username">
          {{ userConfigInfo.owner ? userConfigInfo.owner : $t('header.notLogin') }}
        </div>

        <div class="avatar" v-if="!userConfigInfo?.avatarUrl">
          <el-icon :size="22"><IEpUserFilled /></el-icon>
        </div>

        <el-dropdown trigger="click" @command="handleCommand" v-if="userConfigInfo?.avatarUrl">
          <span class="el-dropdown-link">
            <span class="avatar">
              <img :src="userConfigInfo?.avatarUrl" :alt="userConfigInfo?.owner" />
            </span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout"> {{ $t('header.logout') }} </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const onUserInfoClick = () => {
  if (!userConfigInfo.logined && router.currentRoute.value.path !== '/config') {
    router.push('/config')
  }
}

const logout = () => {
  store.dispatch('LOGOUT')
  router.push('/config')
}

const handleCommand = (command: string) => {
  // eslint-disable-next-line default-case
  switch (command) {
    case 'upload':
      router.push('/')
      break

    case 'config':
      router.push('/config')
      break

    case 'management':
      router.push('/management')
      break

    case 'logout':
      logout()
      break
  }
}
</script>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
