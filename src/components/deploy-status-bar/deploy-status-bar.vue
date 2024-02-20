<template>
  <div class="deploy-status-bar-box border-box">
    <div
      class="deploy-item status-bar info"
      v-for="(di, idx) in deployStatusInfo"
      :key="idx + di.uuid"
    >
      <div class="left-wrap flex-start">
        <span
          class="deploy-status-icon info-item"
          :class="{
            success: di.status === true,
            fail: di.status === false
          }"
        ></span>
        <span class="deploy-datetime info-item" v-if="di.latestTime">
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

<script setup lang="ts">
import { computed } from 'vue'
import { store } from '@/stores'
import { checkoutGhPagesBranch } from '@/common/api'
import { ImageLinkTypeEnum } from '@/common/model'
import { formatDatetime } from '@/utils'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import {
  getDeployServerName,
  saveCloudDeployInfo
} from '@/components/deploy-status-bar/deploy-status-bar.util'
import i18n from '@/plugins/vue/i18n'
import { DeployItemInfo } from '@/stores/modules/deploy-status/types'

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const deployStatusInfo = computed(() => store.getters.getDeployStatusInfo).value

defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const onDeploy = (deployItem: DeployItemInfo) => {
  // eslint-disable-next-line default-case
  switch (deployItem.type) {
    case DeployServerEnum.githubPages:
      // 部署到 GitHub Pages
      checkoutGhPagesBranch(userConfigInfo, (event: boolean) => {
        deployStatusInfo.github.status = event
        deployStatusInfo.github.latestTime = Date.now()
        // 保存部署状态到云端仓库
        saveCloudDeployInfo()
        if (event) {
          // 部署成功
          userSettings.imageLinkType.selected = ImageLinkTypeEnum.GitHubPages
          store.dispatch('USER_SETTINGS_PERSIST')
          ElMessage.success(i18n.global.t('settings_page.image_hosting_deploy.success'))
        } else {
          // 部署失败
          ElMessage.error(i18n.global.t('settings_page.image_hosting_deploy.fail2'))
        }
      })
      return

    case DeployServerEnum.vervel:
      console.log('部署 Vervel 暂未实现')
  }
}
</script>

<style scoped lang="stylus">
@import "deploy-status-bar.styl"
</style>
