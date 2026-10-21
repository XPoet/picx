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
  <section class="settings-section deployment-settings">
    <header class="settings-section-heading">
      <h1 id="deployment-title">
        {{ $t('settings_workspace.deployment') }}
      </h1><p>{{ $t('settings_workspace.deployment_desc') }}</p>
    </header>
    <div class="settings-grid deployment-settings__grid">
      <article class="settings-card deployment-settings__status">
        <DeployStatusBar />
      </article>
      <article class="settings-card">
        <form class="settings-domain-form" @submit.prevent="save">
          <div class="deployment-settings__domain-heading">
            <span class="deployment-settings__symbol"><PicxIcon name="globe" :size="22" /></span>
            <label :for="id" class="settings-field-title">{{ $t('settings_page.image_hosting_deploy.custom_domain_label') }}</label>
          </div>
          <p>{{ $t('domain_settings.description') }}</p>
          <el-input :id="id" v-model="input" :class="{ 'is-invalid': invalid }" :placeholder="$t('settings_page.image_hosting_deploy.custom_domain_placeholder')" :disabled="busy" @input="dirty = true; invalid = false" />
          <p data-testid="domain-normalized">
            {{ $t('domain_settings.normalized', { domain: normalized || $t('domain_settings.no_domain') }) }}
          </p>
          <p v-if="invalid" role="alert" class="settings-error">
            {{ $t('settings_page.image_hosting_deploy.custom_domain_invalid') }}
          </p>
          <div v-if="pagesDomain" class="deployment-settings__dns">
            <PicxIcon name="info" :size="18" />
            <p>{{ $t('domain_settings.dns', { pagesDomain }) }}</p>
          </div>
          <div class="deployment-settings__domain-footer">
            <p>{{ $t('domain_settings.format_hint') }}</p>
            <el-button type="primary" native-type="submit" :loading="feedback?.phase === 'running' && busy" :disabled="!canDeploy">
              <PicxIcon name="check" :size="18" />{{ $t('domain_settings.save') }}
            </el-button>
          </div>
        </form>
        <div v-if="feedback" class="domain-save-feedback" role="status">
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
@import "./deployment-settings.styl"
</style>
