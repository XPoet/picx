<template>
  <main class="main-container">
    <div class="top-container border-box">
      <header-content />
    </div>
    <div class="bottom-container border-box">
      <div
        class="bottom-left-box border-box"
        :class="{ folded: store.getters.getGlobalSettings.folded }"
      >
        <nav-content />
      </div>
      <div class="bottom-right-box border-box">
        <router-view />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HeaderContent from '@/components/header-content/header-content.vue'
import NavContent from '@/components/nav-content/nav-content.vue'
import themeModeHandle from '@/utils/set-theme-mode'
import { store } from '@/stores'
import {
  getCloudDeployInfo,
  setCloudDeployInfo
} from '@/components/deploy-status-bar/deploy-status-bar.util'

const initDeployStatus = async () => {
  const res = await getCloudDeployInfo()
  if (res) {
    await setCloudDeployInfo(res.content)
  }
}

onMounted(() => {
  themeModeHandle()
  initDeployStatus()
})
</script>

<style scoped lang="stylus">
@import "./main-container.styl"
</style>
