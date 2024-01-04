<template>
  <main class="main-container">
    <div class="top-container">
      <header-content />
    </div>

    <div class="bottom-container">
      <div class="bottom-content">
        <div class="left">
          <nav-content />
        </div>

        <div class="right">
          <router-view />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import HeaderContent from '@/components/header-content/header-content.vue'
import NavContent from '@/components/nav-content/nav-content.vue'
import themeModeHandle from '@/utils/set-theme-mode'
import { getCloudDeployInfo, setCloudDeployInfo } from '@/views/main-container/main-container.util'
import { store } from '@/stores'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const initDeployStatus = async () => {
  const res = await getCloudDeployInfo()
  if (res) {
    setCloudDeployInfo(res.content)
  }
}

onMounted(() => {
  themeModeHandle()
})

watch(
  () => userConfigInfo.selectedBranch,
  (nv) => {
    if (nv && userConfigInfo.owner && userConfigInfo.selectedRepo) {
      initDeployStatus()
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped lang="stylus">
@import "./main-container.styl"
</style>
