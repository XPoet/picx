<template>
  <el-cascader
    :style="{
      width: elWidth
    }"
    :size="elSize"
    :debounce="500"
    :props="cascaderProps"
    :key="elKey"
    v-model="userConfigInfo.selectedDirList"
    filterable
    :placeholder="$t('config_page.placeholder_5')"
    :clearable="elClearable"
    @change="cascaderChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getDirInfoList } from '@/common/api'
import { useStore } from '@/stores'
import { ElementPlusSizeEnum } from '@/common/model'
import { NEW_DIR_COUNT_MAX } from '@/common/constant'

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

defineProps({
  elKey: {
    type: String,
    default: ''
  },
  elSize: {
    type: String as () => ElementPlusSizeEnum,
    default: ElementPlusSizeEnum.default
  },
  elWidth: {
    type: String,
    default: '100%'
  },
  elClearable: {
    type: Boolean,
    default: false
  }
})

const cascaderProps = {
  lazy: true,
  checkStrictly: true,
  async lazyLoad(node: any, resolve: any) {
    const { level, pathLabels } = node
    let dirs: any[]
    if (level === 0) {
      dirs = userConfigInfo.dirList
    } else {
      dirs = await getDirInfoList(userConfigInfo, pathLabels.join('/'))
    }
    if (dirs.length) {
      resolve(
        dirs.map((x: any) => ({
          value: x.value,
          label: x.label,
          leaf: level >= NEW_DIR_COUNT_MAX - 1
        }))
      )
    } else {
      resolve([])
    }
  }
}

const cascaderChange = (e: string[]) => {
  if (Array.isArray(e) && e.length) {
    userConfigInfo.selectedDirList = e
    userConfigInfo.selectedDir = e.join('/')
  } else {
    userConfigInfo.selectedDirList = []
    userConfigInfo.selectedDir = ''
  }
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>
