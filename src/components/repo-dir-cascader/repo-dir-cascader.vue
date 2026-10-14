<script setup lang="ts">
import { computed } from 'vue'
import { getDirInfoList } from '@/common/api'
import { NEW_DIR_COUNT_MAX } from '@/common/constant'
import { ElementPlusSizeEnum } from '@/common/model'
import { useStore } from '@/stores'

defineProps({
  elKey: {
    type: String,
    default: '',
  },
  elSize: {
    type: String as () => ElementPlusSizeEnum,
    default: ElementPlusSizeEnum.default,
  },
  elWidth: {
    type: String,
    default: '100%',
  },
  elClearable: {
    type: Boolean,
    default: false,
  },
})
const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const cascaderProps = {
  lazy: true,
  checkStrictly: true,
  async lazyLoad(node: any, resolve: any) {
    const { level, pathLabels } = node
    let dirs: any[]
    if (level === 0) {
      dirs = userConfigInfo.dirList
    }
    else {
      dirs = await getDirInfoList(userConfigInfo, pathLabels.join('/'))
    }
    if (dirs.length) {
      resolve(
        dirs.map((x: any) => ({
          value: x.value,
          label: x.label,
          leaf: level >= NEW_DIR_COUNT_MAX - 1,
        })),
      )
    }
    else {
      resolve([])
    }
  },
}

const cascaderChange = (value: unknown) => {
  if (Array.isArray(value) && value.every(item => typeof item === 'string') && value.length) {
    userConfigInfo.selectedDirList = value
    userConfigInfo.selectedDir = value.join('/')
  }
  else {
    userConfigInfo.selectedDirList = []
    userConfigInfo.selectedDir = ''
  }
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<template>
  <el-cascader
    :key="elKey"
    v-model="userConfigInfo.selectedDirList"
    :style="{
      width: elWidth,
    }"
    :size="elSize"
    :debounce="500"
    :props="cascaderProps"
    filterable
    :placeholder="$t('config_page.placeholder_5')"
    :clearable="elClearable"
    @change="cascaderChange"
  />
</template>
