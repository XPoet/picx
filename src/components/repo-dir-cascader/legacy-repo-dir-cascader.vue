<script setup lang="ts">
import { computed } from 'vue'
import { getDirInfoList } from '@/common/api'
import { NEW_DIR_COUNT_MAX } from '@/common/constant'
import { ElementPlusSizeEnum } from '@/common/model'
import { useStore } from '@/stores'

withDefaults(defineProps<{
  elKey?: string
  elSize?: ElementPlusSizeEnum
  elWidth?: string
  elClearable?: boolean
}>(), { elKey: '', elSize: ElementPlusSizeEnum.default, elWidth: '100%', elClearable: false })

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const cascaderProps = {
  lazy: true,
  checkStrictly: true,
  async lazyLoad(node: { level: number, pathLabels: string[] }, resolve: (items: { value: string, label: string, leaf: boolean }[]) => void) {
    const dirs = node.level === 0 ? userConfigInfo.dirList : await getDirInfoList(userConfigInfo, node.pathLabels.join('/'))
    resolve(dirs.map(item => ({ ...item, leaf: node.level >= NEW_DIR_COUNT_MAX - 1 })))
  },
}
function change(value: unknown) {
  const segments = Array.isArray(value) && value.every(item => typeof item === 'string') ? value : []
  userConfigInfo.selectedDirList = segments
  userConfigInfo.selectedDir = segments.join('/')
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<template>
  <el-cascader
    :key="elKey"
    :model-value="userConfigInfo.selectedDirList"
    :style="{ width: elWidth }"
    :size="elSize"
    :debounce="500"
    :props="cascaderProps"
    filterable
    :placeholder="$t('config_page.placeholder_5')"
    :clearable="elClearable"
    @change="change"
  />
</template>
