<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { isValidCustomDomain, normalizeCustomDomain } from '@/common/api/deploy'
import { canDeploy, deployment, domainSaveFeedback, saveDomainAndDeploy } from '@/components/deploy-status-bar/deploy-status-bar.util'
import DeployStatusBar from '@/components/deploy-status-bar/deploy-status-bar.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'

const store = usePicxStore(pinia)
const id = useId()
const input = ref(store.getUserSettings.deploy.customDomain)
const dirty = ref(false)
const invalid = ref(false)
const normalized = computed(() => normalizeCustomDomain(input.value))
const pagesDomain = computed(() => store.getUserConfigInfo.owner ? `${store.getUserConfigInfo.owner}.github.io` : '')
const busy = deployment.busy
const feedback = domainSaveFeedback
watch(() => store.getUserSettings.deploy.customDomain, (value) => {
  if (!dirty.value)
    input.value = value
})
async function save() {
  if (!canDeploy.value)
    return
  invalid.value = Boolean((input.value.trim() && !normalized.value) || (normalized.value && !isValidCustomDomain(normalized.value)))
  if (invalid.value)
    return
  const result = await saveDomainAndDeploy(normalized.value)
  if (feedback.value?.phase !== 'cancelled' && (result.phase === 'available' || result.phase === 'waiting')) {
    input.value = normalized.value
    dirty.value = false
  }
}
</script>

<template>
  <section aria-labelledby="deployment-title" class="settings-section">
    <header class="settings-section-heading">
      <h1 id="deployment-title">
        {{ $t('settings_workspace.deployment') }}
      </h1><p>{{ $t('settings_workspace.deployment_desc') }}</p>
    </header>
    <div class="settings-grid">
      <article class="settings-card">
        <DeployStatusBar /><p>{{ $t('settings_workspace.deploy_desc') }}</p>
      </article>
      <article class="settings-card">
        <form class="settings-domain-form" @submit.prevent="save">
          <label :for="id" class="settings-field-title">{{ $t('settings_page.image_hosting_deploy.custom_domain_label') }}</label>
          <div class="settings-domain-row">
            <el-input :id="id" v-model="input" :placeholder="$t('settings_page.image_hosting_deploy.custom_domain_placeholder')" :disabled="busy" :aria-invalid="invalid" @input="dirty = true; invalid = false" />
            <el-button type="primary" native-type="submit" :loading="feedback?.phase === 'running' && busy" :disabled="!canDeploy">
              <PicxIcon name="download" :size="18" />{{ $t('domain_settings.save') }}
            </el-button>
          </div>
          <p>{{ $t('domain_settings.format_hint') }}</p>
          <p data-testid="domain-normalized">
            {{ $t('domain_settings.normalized', { domain: normalized || $t('domain_settings.no_domain') }) }}
          </p>
          <p v-if="invalid" role="alert" class="settings-error">
            {{ $t('settings_page.image_hosting_deploy.custom_domain_invalid') }}
          </p>
          <p v-if="pagesDomain" class="settings-preview">
            {{ $t('domain_settings.dns', { pagesDomain }) }}
          </p>
        </form>
        <div v-if="feedback" class="domain-save-feedback" aria-live="polite" role="status">
          <p v-if="feedback.localSaved">
            {{ $t('domain_settings.local_saved', { domain: feedback.domain || $t('domain_settings.no_domain') }) }}
          </p>
          <p v-if="feedback.cnameStatus">
            {{ $t(`domain_settings.cname_${feedback.cnameStatus}`) }}
          </p>
          <p v-if="feedback.phase === 'running'">
            {{ $t('domain_settings.running') }}
          </p>
          <p v-if="feedback.phase === 'cancelled'">
            {{ $t('domain_settings.cancelled') }}
          </p>
          <p v-if="feedback.phase === 'failed'" class="settings-error">
            {{ $t(`domain_settings.failed_${feedback.scope || 'deployment'}`) }}
          </p>
          <p v-if="feedback.scope !== 'local' && feedback.error" class="settings-error">
            {{ $t(`request_error.${feedback.error.kind}`) }}
          </p>
          <p v-if="feedback.phase === 'available' || feedback.phase === 'waiting'">
            {{ $t(`deployment.${feedback.phase}`) }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="stylus">
.settings-domain-form, .domain-save-feedback {
  display grid
  gap 12px
  min-width 0
}
</style>
