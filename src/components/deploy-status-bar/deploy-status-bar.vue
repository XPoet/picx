<template>
  <div class="deploy-status-bar-box deploy-status-bar" :class="{ compact }">
    <div class="deploy-item">
      <div class="left-wrap">
        <div class="deploy-status-bar__heading">
          <span v-if="!compact" class="deploy-status-bar__symbol"><PicxIcon name="rocket" :size="22" /></span>
          <strong>GitHub Pages</strong>
        </div>
        <el-tag class="deployment-state" :type="state.phase === 'available' ? 'success' : state.phase === 'failed' ? 'danger' : state.phase === 'waiting' ? 'warning' : 'info'" :size="compact ? 'small' : 'default'" effect="light" role="status">
          {{ $t(`deployment.${state.phase === 'available' ? 'deployed' : state.phase}`) }}
        </el-tag>
      </div>
      <p v-if="!compact" class="deploy-status-bar__description">
        {{ $t('deployment.description') }}
      </p>
      <div v-if="state.phase === 'available'" class="deployment-time deploy-status-bar__time">
        <span>{{ $t('deployment.last_deployed') }}</span>
        <time v-if="state.deployedAt" :datetime="state.deployedAt">{{ deploymentTime }}</time>
        <span v-else>{{ $t('deployment.time_unavailable') }}</span>
      </div>
      <p v-if="state.phase === 'submitting'">
        {{ $t(`deployment.step_${state.step}`) }}
      </p>
      <p v-if="state.phase === 'failed'" role="alert">
        {{ $t(`request_error.${state.error.kind}`) }}
      </p>
      <p v-if="state.phase === 'waiting'">
        {{ $t('deployment.waiting_hint') }}
      </p>
      <div class="deploy-status-bar__footer">
        <p v-if="!compact" class="deploy-status-bar__auto-check">
          {{ $t('settings_workspace.deploy_desc') }}
        </p>
        <div class="deployment-actions">
          <el-button type="primary" :plain="compact" :disabled="disabled || !canDeploy" :loading="busy" @click="deployGhPages()">
            <PicxIcon name="rocket" :size="18" />{{ $t(state.phase === 'available' ? 'deployment.redeploy' : compact ? 'upload_workspace.deploy' : 'settings_page.image_hosting_deploy.one_click_deploy') }} ({{ shortcut }} + D)
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint vue/block-order: ["error", { order: ["template", "script", "style"] }] */
import type { DeployStatusBarProps } from './deploy-status-bar.model'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { getOSName } from '@/utils/system'
import { canDeploy, deployGhPages, deployment, useDeploymentEntry } from './deploy-status-bar.util'

const props = withDefaults(defineProps<DeployStatusBarProps>(), { disabled: false, compact: false })
const { locale } = useI18n()
useDeploymentEntry(() => !props.disabled && canDeploy.value)
const shortcut = getOSName() === 'mac' ? '⌘' : 'Ctrl'
const state = deployment.state
const busy = deployment.busy
const deploymentTime = computed(() => state.value.phase === 'available' && state.value.deployedAt
  ? new Date(state.value.deployedAt).toLocaleString(locale.value, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' })
  : '')
onMounted(() => void deployment.check())
</script>

<style scoped lang="stylus">
@import "deploy-status-bar.styl"
</style>
