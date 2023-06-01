<template>
  <div class="selected-info-bar-box" v-if="userConfigInfo.selectedRepo">
    <span class="info-item repo">
      {{ $t('repo') }}：
      <el-tag disable-transitions>
        {{ userConfigInfo.selectedRepo }}
      </el-tag>
    </span>
    <span class="info-item branch" v-if="userConfigInfo.selectedBranch">
      {{ $t('branch') }}：
      <el-tag disable-transitions>
        {{ userConfigInfo.selectedBranch }}
      </el-tag>
    </span>
    <span class="info-item dir">
      {{ $t('dir') }}：
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
        el-width=""
        :el-clearable="false"
        v-if="userConfigInfo.dirMode === DirModeEnum.repoDir && barType === 'upload'"
      />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/stores'
import { DirModeEnum, ElementPlusSizeEnum } from '@/common/model'

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const userSettings = computed(() => store.getters.getUserSettings)

defineProps({
  barType: {
    type: String,
    default: 'upload'
  }
})
</script>

<style scoped lang="stylus">
@import "selected-info-bar.styl"
</style>
