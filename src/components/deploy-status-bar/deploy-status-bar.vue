<script setup lang="ts">
import type { DeployItemInfo } from '@/stores/modules/deploy-status/types'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import {
  deployGhPages,
  getDeployServerName,
} from '@/components/deploy-status-bar/deploy-status-bar.util'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { store } from '@/stores'
import { formatDatetime, getOSName } from '@/utils'
import { workspaceInputBlocked } from '@/utils/workspace-input'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})
const deployStatusInfo = computed(() => store.getters.getDeployStatusInfo).value

const shortcutKey = computed(() => (getOSName() === 'mac' ? '⌘' : 'Ctrl'))

const isDeploying = ref(false)

const onDeploy = (deployItem: DeployItemInfo) => {
  if (deployItem.type !== DeployServerEnum.githubPages) {
    return
  }

  // 部署到 GitHub Pages（内部会先同步主分支 CNAME 与设置的自定义域名一致）
  deployGhPages()
}

// 一键部署快捷组合键 Command/Ctrl + D，与一键部署按钮等价（部署进行中或按钮禁用时不触发）
const onDeployShortcut = () => {
  if (props.disabled || isDeploying.value) {
    return
  }

  isDeploying.value = true
  deployGhPages(() => {
    isDeploying.value = false
  })
}

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled || isDeploying.value || event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.shiftKey
    || !document.hasFocus() || workspaceInputBlocked(event.target)) {
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault()
    onDeployShortcut()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="deploy-status-bar-box border-box">
    <div
      v-for="(di, idx) in deployStatusInfo"
      :key="idx + di.uuid"
      class="deploy-item status-bar info"
    >
      <div class="left-wrap flex-start">
        <PicxIcon
          :name="di.status === true ? 'circle-check' : di.status === false ? 'triangle-alert' : 'circle-dashed'"
          :size="16"
          class="deploy-status-icon info-item"
          :class="{
            success: di.status === true,
            fail: di.status === false,
          }"
        />
        <span v-if="di.latestTime" class="deploy-datetime info-item">
          {{ formatDatetime('yyyy-MM-dd hh:mm:ss', di.latestTime) }}
        </span>
        <span class="deploy-server info-item"> {{ getDeployServerName(di.type) }} </span>
        <span class="deploy-status info-item">
          {{
            di.status === null
              ? $t('settings_page.image_hosting_deploy.not_deployed')
              : di.status === true
                ? $t('settings_page.image_hosting_deploy.success')
                : $t('settings_page.image_hosting_deploy.fail')
          }}
        </span>
      </div>

      <div class="right-wrap">
        <el-button type="primary" :disabled="disabled" text @click="onDeploy(di)">
          <PicxIcon name="rocket" :size="16" />
          {{ $t('settings_page.image_hosting_deploy.one_click_deploy') }}
          <span class="shortcut-key">{{ shortcutKey }} D</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "deploy-status-bar.styl"
</style>
