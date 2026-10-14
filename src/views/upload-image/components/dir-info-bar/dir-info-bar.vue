<script lang="ts" setup>
import { computed } from 'vue'
import { DirModeEnum, ElementPlusSizeEnum } from '@/common/model'
import router from '@/router'
import { useStore } from '@/stores'

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const globalSettings = computed(() => store.getters.getGlobalSettings)

const goConfigPage = () => {
  router.push('/config')
}
</script>

<template>
  <div v-if="userConfigInfo.repo && userConfigInfo.branch" class="dir-info-bar border-box">
    <div class="dir-name" @click="goConfigPage">
      <el-icon><IEpFolder /></el-icon>
      {{ $t('dir') }}
    </div>
    <repo-dir-cascader
      v-if="userConfigInfo.dirMode === DirModeEnum.repoDir"
      :el-size="
        globalSettings!.elementPlusSize === ElementPlusSizeEnum.large
          ? ElementPlusSizeEnum.default
          : globalSettings.elementPlusSize
      "
      :el-clearable="false"
    />
    <el-tag v-else disable-transitions>
      {{ userConfigInfo.selectedDir }}
    </el-tag>
  </div>
</template>

<style scoped lang="stylus">
@import "dir-info-bar.styl"
</style>
