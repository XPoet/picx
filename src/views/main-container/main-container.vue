<script setup lang="ts">
import { onMounted } from 'vue'
import {
  getCloudDeployInfo,
  setCloudDeployInfo,
} from '@/components/deploy-status-bar/deploy-status-bar.util'
import HeaderContent from '@/components/header-content/header-content.vue'
import NavContent from '@/components/nav-content/nav-content.vue'
import { store } from '@/stores'
import themeModeHandle from '@/utils/set-theme-mode'

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

<template>
  <div class="main-container" :class="{ folded: store.getters.getGlobalSettings.folded }">
    <aside class="sidebar border-box">
      <HeaderContent />
      <NavContent />
    </aside>
    <main class="main-content border-box">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="stylus">
@import "./main-container.styl"
</style>
