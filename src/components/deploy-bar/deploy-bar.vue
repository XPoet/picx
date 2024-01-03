<template>
  <div class="deploy-box border-box">
    <div
      class="deploy-item border-box"
      v-for="(di, idx) in userSettings.deploy"
      :key="idx + di.uuid"
    >
      <div class="left-wrap">
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
              ? $t('settings.image_hosting_deploy.not_deployed')
              : di.status === true
              ? $t('settings.image_hosting_deploy.success')
              : $t('settings.image_hosting_deploy.fail')
          }}
        </span>
      </div>

      <div class="right-wrap">
        <el-tooltip
          placement="top"
          :content="
            $t('settings.image_hosting_deploy.deploy_to', { server: getDeployServerName(di.type) })
          "
        >
          <el-button type="primary" :disabled="disabled" text @click="onDeploy(di)">
            {{ $t('settings.image_hosting_deploy.one_click_deploy') }}
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { store } from '@/stores'
import { checkoutGhPagesBranch } from '@/common/api'
import { DeployStatusInfo, ImageLinkTypeEnum } from '@/common/model'
import { formatDatetime } from '@/utils'
import { DeployServerEnum } from '@/components/deploy-bar/deploy-bar.model'
import { getDeployServerName } from '@/components/deploy-bar/deploy-bar.util'
import i18n from '@/plugins/vue/i18n'
import { saveCloudDeployInfo } from '@/views/main-container/main-container.util'

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const onDeploy = (deployItem: DeployStatusInfo) => {
  // eslint-disable-next-line default-case
  switch (deployItem.type) {
    case DeployServerEnum.githubPages:
      checkoutGhPagesBranch(userConfigInfo, (event: boolean) => {
        userSettings.deploy.github.status = event
        userSettings.deploy.github.latestTime = Date.now()
        // 保存部署状态到云端仓库
        saveCloudDeployInfo()
        if (event) {
          // 部署成功
          userSettings.imageLinkType.selected = ImageLinkTypeEnum.GitHubPages
          store.dispatch('USER_SETTINGS_PERSIST')
          ElMessage.success(i18n.global.t('settings.image_hosting_deploy.success'))
        } else {
          // 部署失败
          ElMessage.error(i18n.global.t('settings.image_hosting_deploy.fail2'))
        }
      })
      return

    case DeployServerEnum.vervel:
      console.log('部署 Vervel 暂未实现')
  }
}
</script>

<style scoped lang="stylus">
@import "deploy-bar.styl"
</style>
