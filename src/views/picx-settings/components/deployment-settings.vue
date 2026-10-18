<script setup lang="ts">
import { computed, ref } from 'vue'
import { isValidCustomDomain, normalizeCustomDomain } from '@/common/api'
import { deployGhPages } from '@/components/deploy-status-bar/deploy-status-bar.util'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const persistUserSettings = () => store.dispatch('USER_SETTINGS_PERSIST')
// 自定义域名（CNAME）
const customDomainInput = ref(userSettings.deploy.customDomain)
const customDomainSyncing = ref(false)
const pagesDomain = userConfigInfo.owner
  ? `${userConfigInfo.owner}.github.io`
  : 'username.github.io'

const saveCustomDomain = () => {
  if (customDomainSyncing.value) {
    return
  }

  const domain = normalizeCustomDomain(customDomainInput.value)
  if (domain && !isValidCustomDomain(domain)) {
    ElMessage.warning(i18n.global.t('settings_page.image_hosting_deploy.custom_domain_invalid'))
    return
  }

  // 先持久化设置（LocalStorage + 云端 .settings 静默同步），deployGhPages 内部会先把
  // customDomain 同步为图床仓库当前分支的 CNAME 文件，再一键部署，保证 CNAME 与设置一致
  userSettings.deploy.customDomain = domain
  customDomainInput.value = domain
  persistUserSettings()

  customDomainSyncing.value = true
  deployGhPages(() => {
    customDomainSyncing.value = false
  })
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
        <deploy-status-bar /><p>{{ $t('settings_workspace.deploy_desc') }}</p>
      </article>
      <article class="settings-card">
        <h2>{{ $t('settings_page.image_hosting_deploy.custom_domain_label') }}</h2>
        <div class="settings-domain-row">
          <el-input v-model="customDomainInput" :aria-label="$t('settings_page.image_hosting_deploy.custom_domain_label')" :placeholder="$t('settings_page.image_hosting_deploy.custom_domain_placeholder')" clearable :disabled="customDomainSyncing" @keyup.enter="saveCustomDomain" /><el-button type="primary" :loading="customDomainSyncing" @click="saveCustomDomain">
            <PicxIcon name="download" :size="18" />{{ $t('settings_page.image_hosting_deploy.custom_domain_save') }}
          </el-button>
        </div>
        <p>{{ $t('settings_page.image_hosting_deploy.custom_domain_desc', { pagesDomain }) }}</p>
      </article>
    </div>
  </section>
</template>
