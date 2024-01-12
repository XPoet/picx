<template>
  <div class="selected-info-bar-box border-box" v-if="userConfigInfo.selectedRepo">
    <div class="dir-name" :class="{ upload: barType === 'upload' }" @click="goConfigPage">
      <el-icon><IEpFolder /></el-icon>
      {{ $t('dir') }}
    </div>
    <el-tag
      disable-transitions
      v-if="userConfigInfo.dirMode !== DirModeEnum.repoDir || barType === 'management'"
    >
      {{ barType === 'management' ? userConfigInfo.viewDir : userConfigInfo.selectedDir }}
    </el-tag>
    <repo-dir-cascader
      :el-size="
        userSettings.elementPlusSize === ElementPlusSizeEnum.large
          ? ElementPlusSizeEnum.default
          : userSettings.elementPlusSize
      "
      :el-clearable="false"
      v-if="userConfigInfo.dirMode === DirModeEnum.repoDir && barType === 'upload'"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/stores'
import { DirModeEnum, ElementPlusSizeEnum } from '@/common/model'
import router from '@/router'

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const userSettings = computed(() => store.getters.getUserSettings)

const props = defineProps({
  barType: {
    type: String as () => 'management' | 'upload',
    default: 'upload'
  }
})

const goConfigPage = () => {
  if (props.barType === 'upload') {
    router.push('/config')
  }
}
</script>

<style scoped lang="stylus">
@import "selected-info-bar.styl"
</style>
