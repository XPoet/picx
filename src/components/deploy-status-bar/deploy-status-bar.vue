<script setup lang="ts">
import type { DeployItemInfo } from '@/stores/modules/deploy-status/types'
import { computed } from 'vue'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import {
  deployGhPages,
  getDeployServerName,
} from '@/components/deploy-status-bar/deploy-status-bar.util'
import { store } from '@/stores'
import { formatDatetime } from '@/utils'

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})
const deployStatusInfo = computed(() => store.getters.getDeployStatusInfo).value

const onDeploy = (deployItem: DeployItemInfo) => {
  if (deployItem.type !== DeployServerEnum.githubPages) {
    return
  }

  // 部署到 GitHub Pages（内部会先同步主分支 CNAME 与设置的自定义域名一致）
  deployGhPages()
}
</script>

<template>
  <div class="deploy-status-bar-box border-box">
    <div
      v-for="(di, idx) in deployStatusInfo"
      :key="idx + di.uuid"
      class="deploy-item status-bar info"
    >
      <div class="left-wrap flex-start">
        <span
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
          {{ $t('settings_page.image_hosting_deploy.one_click_deploy') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "deploy-status-bar.styl"
</style>
