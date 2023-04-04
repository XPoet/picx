<template>
  <div class="page-container">
    <div v-if="showTool" class="tool-panel">
      <div class="panel-header">
        <el-breadcrumb separator-icon="ArrowRight">
          <el-breadcrumb-item :to="{ path: '/tools' }">工具箱</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentTool.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="panel-body">
        <router-view />
      </div>
    </div>
    <ul v-else class="tool-box">
      <li class="tool-item" v-for="tool in toolList" :key="tool.uuid" @click="useTool(tool)">
        <div class="top">
          <div class="left"></div>
          <div class="right">{{ tool.name }}</div>
        </div>
        <div class="bottom">{{ tool.desc }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUuid } from '@/utils'
import { ToolItemModel } from '@/common/model'

const router = useRouter()

const showTool = ref(false)
const currentTool = reactive<ToolItemModel>({
  path: '',
  icon: '',
  name: '',
  desc: '',
  uuid: ''
})

const toolList = ref<ToolItemModel[]>([
  {
    name: '图片压缩',
    desc: '不限制图片大小数量，不上传至服务器离线极速压缩',
    icon: '',
    uuid: getUuid(),
    path: '/compress'
  },
  {
    name: '图片水印',
    desc: '不限制图片大小数量，不上传至服务器离线极速压缩',
    icon: '',
    uuid: getUuid(),
    path: '/compress'
  },
  {
    name: '图片转 Base64',
    desc: '不限制图片大小数量，不上传至服务器离线极速压缩',
    icon: '',
    uuid: getUuid(),
    path: '/compress'
  }
])

const useTool = (tool: ToolItemModel) => {
  showTool.value = true
  currentTool.name = tool.name
  router.push(`/tools${tool.path}`)
}

watch(
  () => router.currentRoute.value,
  (newValue) => {
    if (newValue.path === '/tools') {
      showTool.value = false
    }
  },
  {
    deep: true
  }
)
</script>

<style scoped lang="stylus">
@import "./tool-box.styl"
</style>
