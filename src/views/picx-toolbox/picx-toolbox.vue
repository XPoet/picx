<template>
  <div class="page-container">
    <div v-if="showToolPanel" class="tool-panel">
      <div class="panel-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item :to="{ path: toolboxPath }">
            {{ $t('nav.toolbox') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t(currentTool.name) }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="panel-body">
        <router-view />
      </div>
    </div>
    <ul v-else class="toolbox">
      <li class="tool-item" v-for="tool in toolboxList" :key="tool.uuid" @click="selectTool(tool)">
        <div class="top">
          <div class="left flex-center">
            <el-icon :size="30">
              <component :is="tool.icon"></component>
            </el-icon>
          </div>
          <div class="right">{{ $t(tool.name) }}</div>
        </div>
        <div class="bottom">{{ $t(tool.desc) }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ToolItemModel } from '@/common/model'
import { store } from '@/stores'
import { toolboxList } from './picx-toolbox.data'

const ArrowRight = shallowRef(IEpArrowRight)

const router = useRouter()

const toolboxPath = ref('/toolbox')
const showToolPanel = ref(false)

const currentTool = ref<ToolItemModel>({
  path: '',
  icon: '',
  name: '',
  desc: '',
  uuid: ''
})

const selectTool = (tool: ToolItemModel) => {
  showToolPanel.value = true
  currentTool.value = { ...tool }
  store.dispatch('TOOLBOX_IMG_LIST_RESET')
  router.push(`${toolboxPath.value}${tool.path}`)
}

watch(
  () => router.currentRoute.value,
  (newValue) => {
    if (newValue.path === toolboxPath.value) {
      showToolPanel.value = false
    }
  },
  {
    deep: true
  }
)

const initHandle = () => {
  router.isReady().then(() => {
    const currentPath = router.currentRoute.value.path
    if (toolboxPath.value !== currentPath) {
      const path = currentPath.substring(currentPath.lastIndexOf('/'))
      const tool = toolboxList.value.find((x) => x.path === path)
      if (tool) {
        selectTool(tool)
      }
    }
  })
}

onMounted(() => {
  initHandle()
})
</script>

<style scoped lang="stylus">
@import "./picx-toolbox.styl"
</style>
