<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useGithubConnection } from '@/composables/use-github-connection'
import router from '@/router'
import { store } from '@/stores'
import { githubAppAuthorize, githubAppAuthorizeCallback, isAuthorizeExpire } from './picx-login.util'

const { connection, busy, connect, restore } = useGithubConnection()
const tokenDraft = ref('')
const tokenVisible = ref(false)
const tokenRequired = ref(false)
const oauthStarting = ref(false)
const activeMethod = ref<'token' | 'oauth' | null>(null)
const tokenInput = useTemplateRef<HTMLInputElement>('tokenInput')
const pending = computed(() => busy.value || oauthStarting.value)
const errorKey = computed(() => {
  if (tokenRequired.value)
    return 'connection.token_required'
  if (connection.value.phase !== 'failed' || !activeMethod.value)
    return ''
  const kind = connection.value.error.kind
  return ['app-not-installed', 'initialization-failed', 'storage-unavailable'].includes(kind)
    ? `connection.${kind}`
    : `request_error.${kind}`
})
const progressKey = computed(() => connection.value.phase === 'initializing'
  ? `connection.step_${connection.value.step}`
  : 'connection.validating')
const installURL = computed(() => store.getters.getUserConfigInfo.id
  ? `${import.meta.env.VITE_INSTALL_URL_USER}${store.getters.getUserConfigInfo.id}`
  : import.meta.env.VITE_INSTALL_URL)

async function submitToken() {
  if (pending.value)
    return
  activeMethod.value = 'token'
  tokenRequired.value = !tokenDraft.value.trim()
  if (tokenRequired.value) {
    tokenInput.value?.focus()
    return
  }
  if (await connect(tokenDraft.value.trim())) {
    tokenDraft.value = ''
    tokenVisible.value = false
    await router.push('/upload')
  }
}

async function submitOAuth() {
  if (pending.value)
    return
  activeMethod.value = 'oauth'
  tokenRequired.value = false
  const saved = store.getters.getGitHubAuthorizationInfo
  if (saved.token && !isAuthorizeExpire()) {
    if (await connect(saved.token, 'oauth'))
      await router.push('/upload')
  }
  else {
    oauthStarting.value = true
    githubAppAuthorize()
  }
}

onMounted(async () => {
  await githubAppAuthorizeCallback()
  const config = store.getters.getUserConfigInfo
  if (router.currentRoute.value.query.focus === '1')
    tokenInput.value?.focus()
  if (router.currentRoute.value.query.jump !== '0' && config.token && config.logined) {
    if (config.repo && config.branch && config.selectedDir) {
      await router.replace('/upload')
    }
    else {
      activeMethod.value = store.getters.getGitHubAuthorizationInfo.isAutoAuthorize ? 'oauth' : 'token'
      if (await restore())
        await router.replace('/upload')
    }
  }
})
</script>

<template>
  <section class="login-container" aria-labelledby="connection-title">
    <header class="connection-intro">
      <h1 id="connection-title">
        {{ $t('connection.title') }}
      </h1>
      <p>{{ $t('connection.description') }}</p>
      <ol class="connection-steps" :aria-label="$t('connection.steps_label')">
        <li v-for="(step, index) in ['connect', 'configure', 'share']" :key="step" :class="{ active: index === 0 }">
          <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
          {{ $t(`connection.steps.${step}`) }}
        </li>
      </ol>
    </header>
    <div class="connection-cards" :aria-busy="pending">
      <section class="connection-card" aria-labelledby="oauth-title">
        <div class="card-heading">
          <span class="login-icon"><PicxIcon name="github" :size="28" /></span>
          <span class="recommended">{{ $t('connection.recommended') }}</span>
        </div>
        <h2 id="oauth-title">
          {{ $t('authorization.text_1') }}
        </h2>
        <p>{{ $t('connection.oauth_description') }}</p>
        <p class="revocation-note">
          <PicxIcon name="shield-check" :size="16" />{{ $t('connection.revoke') }}
        </p>
        <div v-if="activeMethod === 'oauth' && errorKey" class="connection-error" role="alert">
          {{ $t(errorKey) }}
        </div>
        <div class="login-actions">
          <el-button type="primary" :loading="pending && activeMethod === 'oauth'" :disabled="pending" @click="submitOAuth">
            <PicxIcon name="github" :size="18" />{{ $t('connection.oauth_continue') }}
          </el-button>
          <div class="login-links">
            <a :href="installURL" target="_blank" rel="noopener noreferrer">{{ $t('authorization.text_11') }}</a>
            <a href="https://picx-docs.xpoet.cn/usage-guide/config.html#github-oauth-授权登录" target="_blank" rel="noopener noreferrer">{{ $t('connection.oauth_help') }}</a>
          </div>
        </div>
      </section>
      <form class="connection-card" aria-labelledby="token-title" @submit.prevent="submitToken">
        <div class="card-heading">
          <span class="login-icon"><PicxIcon name="key-round" :size="28" /></span>
        </div>
        <h2 id="token-title">
          {{ $t('authorization.text_2') }}
        </h2>
        <p id="token-description">
          {{ $t('connection.token_description') }}
        </p>
        <div class="token-field">
          <label for="connection-token">{{ $t('connection.token_label') }}</label>
          <div class="token-input-wrap" :class="{ invalid: activeMethod === 'token' && errorKey }">
            <input
              id="connection-token"
              ref="tokenInput"
              v-model="tokenDraft"
              :type="tokenVisible ? 'text' : 'password'"
              :placeholder="$t('config_page.input_token')"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
              :disabled="pending"
              :aria-invalid="Boolean(activeMethod === 'token' && errorKey)"
              :aria-describedby="activeMethod === 'token' && errorKey ? 'token-description token-error' : 'token-description'"
              @input="tokenRequired = false"
            >
            <button type="button" class="picx-icon-button" :disabled="pending" :aria-label="$t(tokenVisible ? 'connection.hide_token' : 'connection.show_token')" :aria-pressed="tokenVisible" @click="tokenVisible = !tokenVisible">
              <PicxIcon :name="tokenVisible ? 'eye-off' : 'eye'" :size="18" />
            </button>
          </div>
          <p v-if="activeMethod === 'token' && errorKey" id="token-error" class="connection-error" role="alert">
            {{ $t(errorKey) }}
          </p>
        </div>
        <div class="login-actions">
          <el-button native-type="submit" :loading="busy && activeMethod === 'token'" :disabled="pending">
            <PicxIcon name="key-round" :size="18" />{{ $t('connection.token_continue') }}
          </el-button>
          <div class="login-links">
            <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">{{ $t('authorization.text_12') }}</a>
            <a href="https://picx-docs.xpoet.cn/usage-guide/config.html#填写-github-token-登录" target="_blank" rel="noopener noreferrer">{{ $t('connection.token_help') }}</a>
          </div>
        </div>
      </form>
    </div>
    <p v-if="pending" class="connection-progress" role="status">
      {{ $t(oauthStarting ? 'connection.redirecting' : progressKey) }}
    </p>
    <p class="credential-note">
      <PicxIcon name="shield-check" :size="18" />{{ $t('connection.credentials_notice') }}
    </p>
  </section>
</template>

<style scoped lang="stylus">
@import './picx-login.styl'
</style>
