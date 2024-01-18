<template>
  <div class="selected-info-bar-box border-box" v-if="userConfigInfo.repo">
    <div
      class="dir-name"
      :class="{ upload: barType === SelectedInfoBarType.upload }"
      @click="goConfigPage"
    >
      <el-icon><IEpFolder /></el-icon>
      {{ $t('dir') }}
    </div>
    <el-tag
      disable-transitions
      v-if="
        userConfigInfo.dirMode !== DirModeEnum.repoDir || barType === SelectedInfoBarType.management
      "
    >
      {{
        barType === SelectedInfoBarType.management
          ? userConfigInfo.viewDir
          : userConfigInfo.selectedDir
      }}
    </el-tag>
    <repo-dir-cascader
      :el-size="
        globalSettings!.elementPlusSize === ElementPlusSizeEnum.large
          ? ElementPlusSizeEnum.default
          : globalSettings.elementPlusSize
      "
      :el-clearable="false"
      v-if="
        userConfigInfo.dirMode === DirModeEnum.repoDir && barType === SelectedInfoBarType.upload
      "
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/stores'
import { DirModeEnum, ElementPlusSizeEnum } from '@/common/model'
import router from '@/router'
import { SelectedInfoBarType } from './selected-info-bar.model'

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const globalSettings = computed(() => store.getters.getGlobalSettings)

const props = defineProps({
  barType: {
    type: Number as () => SelectedInfoBarType,
    default: SelectedInfoBarType.upload
  }
})

const goConfigPage = () => {
  if (props.barType === SelectedInfoBarType.upload) {
    router.push('/config')
  }
}
</script>

<style scoped lang="stylus">
@import "selected-info-bar.styl"
</style>
