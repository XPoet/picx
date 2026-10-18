<script setup lang="ts">
import { computed, onMounted } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { deployGhPages, deployment } from './deploy-status-bar.util'

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })
const state = deployment.state
const busy = deployment.busy
const icon = computed(() => state.value.phase === 'available' ? 'circle-check' : state.value.phase === 'failed' ? 'triangle-alert' : 'circle-dashed')
onMounted(() => {
  if (state.value.phase === 'idle')
    void deployment.check()
})
</script>

<template>
  <div class="deploy-status-bar-box">
    <div class="deploy-item" aria-live="polite">
      <div class="left-wrap">
        <PicxIcon :name="icon" :size="18" />
        <strong>GitHub Pages</strong>
        <span>{{ $t(`deployment.${state.phase}`) }}</span>
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
      <a v-if="state.phase === 'available'" :href="state.url" target="_blank" rel="noopener noreferrer">{{ $t('deployment.visit') }}<PicxIcon name="external-link" :size="16" /></a>
      <div class="deployment-actions">
        <el-button type="primary" :disabled="disabled || busy" :loading="busy" @click="deployGhPages()">
          <PicxIcon name="rocket" :size="18" />{{ $t('settings_page.image_hosting_deploy.one_click_deploy') }}
        </el-button>
        <el-button v-if="state.phase !== 'idle'" :disabled="disabled || busy" @click="deployment.check()">
          {{ $t('deployment.check') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "deploy-status-bar.styl"
</style>
