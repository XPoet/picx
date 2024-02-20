<template>
  <div class="tools-bar border-box">
    <div class="left flex-start">
      <el-button text circle :disabled="userConfigInfo.viewDir === '/'" @click="onBack">
        <el-icon :size="18">
          <IEpArrowLeftBold></IEpArrowLeftBold>
        </el-icon>
      </el-button>

      <div class="dir-info flex-start">
        <el-icon><IEpFolder /></el-icon>
        {{ userConfigInfo.viewDir.split('/').join(' / ') }}
      </div>
    </div>
    <div class="right flex-end">
      <copy-source-repo position="management" />
      <el-tooltip
        placement="top"
        :content="$t('management_page.reload')"
        :show-arrow="false"
        :offset="6"
      >
        <el-icon class="btn-icon" @click.stop="emits('reload')">
          <IEpRefresh />
        </el-icon>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { store } from '@/stores'

const emits = defineEmits(['reload'])

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const onBack = () => {
  const currentDir = userConfigInfo.viewDir

  if (currentDir === '/') {
    return
  }

  const currentDirList = currentDir.split('/')

  if (currentDirList.length === 1) {
    userConfigInfo.viewDir = '/'
  } else if (currentDirList.length > 1) {
    currentDirList.length -= 1
    userConfigInfo.viewDir = currentDirList.join('/')
  }
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<style scoped lang="stylus">
@import "tools-bar.styl"
</style>
