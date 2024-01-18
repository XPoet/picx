<template>
  <div class="dir-info-bar border-box" v-if="userConfigInfo.repo && userConfigInfo.branch">
    <div class="dir-name" @click="goConfigPage">
      <el-icon><IEpFolder /></el-icon>
      {{ $t('dir') }}
    </div>
    <repo-dir-cascader
      :el-size="
        globalSettings!.elementPlusSize === ElementPlusSizeEnum.large
          ? ElementPlusSizeEnum.default
          : globalSettings.elementPlusSize
      "
      :el-clearable="false"
      v-if="userConfigInfo.dirMode === DirModeEnum.repoDir"
    />
    <el-tag disable-transitions v-else>
      {{ userConfigInfo.selectedDir }}
    </el-tag>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/stores'
import { DirModeEnum, ElementPlusSizeEnum } from '@/common/model'
import router from '@/router'

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const globalSettings = computed(() => store.getters.getGlobalSettings)

const goConfigPage = () => {
  router.push('/config')
}
</script>

<style scoped lang="stylus">
@import "dir-info-bar.styl"
</style>
