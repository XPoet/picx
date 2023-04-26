<template>
  <div class="page-container">
    <div v-if="showToolPanel" class="tool-panel">
      <div class="panel-header">
        <el-breadcrumb separator-icon="ArrowRight">
          <el-breadcrumb-item :to="{ path: toolboxPath }">工具箱</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentTool.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="panel-body">
        <router-view />
      </div>
    </div>
    <ul v-else class="toolbox">
      <li class="tool-item" v-for="tool in toolList" :key="tool.uuid" @click="selectTool(tool)">
        <div class="top">
          <div class="left flex-center">
            <el-icon :size="30">
              <component :is="tool.icon"></component>
            </el-icon>
          </div>
          <div class="right">{{ tool.name }}</div>
        </div>
        <div class="bottom">{{ tool.desc }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUuid } from '@/utils'
import { ToolItemModel } from '@/common/model'
import { store } from '@/store'

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

const toolList = ref<ToolItemModel[]>([
  {
    name: '图片压缩',
    desc: '不限制图片大小和数量，不上传至服务器的离线极致压缩',
    icon: 'MagicStick',
    uuid: getUuid(),
    path: '/compress'
  },
  {
    name: '图片转 Base64',
    desc: '不限制图片大小和数量，在线转换成 Base64 编码',
    icon: 'Paperclip',
    uuid: getUuid(),
    path: '/base64'
  },
  {
    name: '图片水印',
    desc: '自定义水印文字、字体大小、位置、颜色和透明度',
    icon: 'Picture',
    uuid: getUuid(),
    path: '/watermark'
  }
])

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
      const tool = toolList.value.find((x) => x.path === path)
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
