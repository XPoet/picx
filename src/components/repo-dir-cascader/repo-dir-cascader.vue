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
    :placeholder="i18nConfig().selectARepo"
    :clearable="elClearable"
    @change="cascaderChange"
  />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { getDirListByPath } from '@/common/api'
import { useStore } from '@/store'
import { ElementPlusSizeEnum, NEW_DIR_COUNT_MAX } from '@/common/model'

const instance = getCurrentInstance()

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

defineProps({
  elKey: {
    type: String,
    default: ''
  },
  elSize: {
    type: String,
    default: ElementPlusSizeEnum.default
  },
  elWidth: {
    type: String,
    default: '100%'
  },
  elClearable: {
    type: Boolean,
    default: true
  }
})

const cascaderProps = {
  lazy: true,
  checkStrictly: true,
  async lazyLoad(node: any, resolve: any) {
    const { level, pathLabels } = node
    let dirs: any
    if (level === 0) {
      dirs = userConfigInfo.dirList
    } else {
      dirs = await getDirListByPath(pathLabels.join('/'))
    }
    if (dirs) {
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

const i18nConfig = () => {
  return {
    selectARepo: instance?.proxy?.$t('selectARepo')
  }
}

const cascaderChange = (e: string[]) => {
  userConfigInfo.selectedDirList = e
  userConfigInfo.selectedDir = e.join('/')
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>
