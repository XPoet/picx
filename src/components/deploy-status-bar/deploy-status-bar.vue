<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ImageLinkTypeEnum } from '@/common/model'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useImageLinkSource } from '@/composables/use-image-link-source'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { getOSName } from '@/utils/system'
import { canDeploy, deployGhPages, deployment, useDeploymentEntry } from './deploy-status-bar.util'

const props = withDefaults(defineProps<{ disabled?: boolean, compact?: boolean }>(), { disabled: false, compact: false })
useDeploymentEntry(() => !props.disabled && canDeploy.value)
const store = usePicxStore(pinia)
const source = useImageLinkSource()
const shortcut = getOSName() === 'mac' ? '⌘' : 'Ctrl'
const usingPages = computed(() => store.getUserSettings.imageLinkType.selected === ImageLinkTypeEnum.GitHubPages)
const state = deployment.state
const busy = deployment.busy
const icon = computed(() => state.value.phase === 'available' ? 'circle-check' : state.value.phase === 'failed' ? 'triangle-alert' : 'circle-dashed')
onMounted(() => {
  if (state.value.phase === 'idle')
    void deployment.check()
})
</script>

<template>
  <div class="deploy-status-bar-box" :class="{ compact }">
    <div class="deploy-item">
      <div class="left-wrap">
        <PicxIcon v-if="!compact" :name="icon" :size="18" />
        <strong>GitHub Pages</strong>
        <span class="deployment-state"><PicxIcon v-if="compact" :name="icon" :size="14" />{{ $t(`deployment.${state.phase}`) }}</span>
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
      <div class="deployment-actions">
        <el-button type="primary" :plain="compact" :disabled="disabled || !canDeploy" :loading="busy" @click="deployGhPages()">
          <PicxIcon v-if="!compact" name="rocket" :size="18" />{{ $t(compact ? 'upload_workspace.deploy' : state.phase === 'available' ? 'deployment.redeploy' : 'settings_page.image_hosting_deploy.one_click_deploy') }}<kbd v-if="!compact">{{ shortcut }} D</kbd>
        </el-button>
        <el-button v-if="state.phase !== 'idle' && (!compact || !['not-deployed', 'checking'].includes(state.phase))" :disabled="disabled || busy" @click="deployment.check()">
          {{ $t('deployment.check') }}
        </el-button>
      </div>
      <el-button v-if="state.phase === 'available' && !usingPages" :disabled="busy || source.checking.value" @click="source.select(ImageLinkTypeEnum.GitHubPages)">
        {{ $t('deployment.use_pages') }}
      </el-button>
      <p v-if="usingPages">
        {{ $t('deployment.using_pages') }}
      </p>
      <p v-if="source.error.value" role="alert">
        {{ $t(source.error.value) }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "deploy-status-bar.styl"
</style>
