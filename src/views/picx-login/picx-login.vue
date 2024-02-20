<template>
  <div class="page-container login-container">
    <div class="left-box box-item">
      <el-button
        plain
        type="primary"
        @click="onGitHubAuthorizeLogin"
        size="large"
        :loading="authorizeLoading"
      >
        {{ $t('authorization.text_1') }}
      </el-button>
      <div class="tips-box">
        <div class="tip-item">{{ $t('authorization.text_8') }}</div>
        <div class="tip-item link" @click="goTargetUrl(UrlTypeEnum.oauthLoginDocs)">
          <el-icon><IEpDocument /></el-icon>
          {{ $t('authorization.text_10') }}
        </div>
        <div class="tip-item link" @click="goTargetUrl(UrlTypeEnum.installGitHubAppURL)">
          <el-icon><IEpLink /></el-icon>
          {{ $t('authorization.text_11') }}
          <el-icon class="install-status" v-if="authorizationInfo.installed">
            <IEpCircleCheckFilled />
          </el-icon>
        </div>
      </div>
    </div>
    <div class="right-box box-item">
      <el-button plain type="primary" size="large" @click="onUseTokenLogin">
        {{ $t('authorization.text_2') }}
      </el-button>
      <div class="tips-box">
        <div class="tip-item">{{ $t('authorization.text_9') }}</div>
        <div class="tip-item link" @click="goTargetUrl(UrlTypeEnum.tokenLoginDocs)">
          <el-icon><IEpDocument /></el-icon>
          {{ $t('authorization.text_10') }}
        </div>
        <div class="tip-item link" @click="goTargetUrl(UrlTypeEnum.generateTokenURL)">
          <el-icon><IEpLink /></el-icon>
          {{ $t('authorization.text_12') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import {
  githubAppAuthorize,
  githubAppAuthorizeCallback,
  isAuthorizeExpire
} from '@/views/picx-login/picx-login.util'
import router from '@/router'
import { store } from '@/stores'
import { UrlTypeEnum } from '@/views/picx-login/picx-login.model'

const authorizationInfo = computed(() => store.getters.getGitHubAuthorizationInfo).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const authorizeLoading = ref(false)

/**
 * GitHub 授权登录
 */
const onGitHubAuthorizeLogin = () => {
  authorizeLoading.value = true

  store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
    isAutoAuthorize: true
  })

  const { authorized, installed, token } = authorizationInfo

  if (authorized && installed && token && !isAuthorizeExpire()) {
    store.dispatch('SET_USER_CONFIG_INFO', {
      token
    })

    router.push('/config')
  } else {
    githubAppAuthorize()
  }
}

/**
 * 填写 Token 登录
 */
const onUseTokenLogin = () => {
  const { manualToken } = authorizationInfo

  store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
    isAutoAuthorize: false
  })

  store.dispatch('SET_USER_CONFIG_INFO', {
    token: manualToken
  })

  router.push({ path: '/config', query: { focus: '1' } })
}

const goTargetUrl = (type: UrlTypeEnum) => {
  let url: string = 'https://picx-docs.xpoet.cn'

  switch (type) {
    case UrlTypeEnum.installGitHubAppURL:
      url = import.meta.env.VITE_INSTALL_URL as string
      if (userConfigInfo.id) {
        url = import.meta.env.VITE_INSTALL_URL_USER + userConfigInfo.id
      }
      window.location.href = url
      break

    case UrlTypeEnum.oauthLoginDocs:
      window.open(`${url}/docs/usage-guide/config.html#github-oauth-授权登录`)
      break

    case UrlTypeEnum.generateTokenURL:
      window.open('https://github.com/settings/tokens/new')
      break

    case UrlTypeEnum.tokenLoginDocs:
      window.open(`${url}/docs/usage-guide/config.html#填写-github-token-登录`)
      break

    default:
      window.open(url)
  }
}

const init = () => {
  const { token, name, owner, repo, branch, selectedDir: dir, logined } = userConfigInfo

  if (router.currentRoute.value.query?.jump !== '0') {
    if (token && name && owner && logined) {
      if (repo && branch && dir) {
        router.push('/upload')
      } else {
        router.push('/config')
      }
    }
  }
}

onMounted(() => {
  githubAppAuthorizeCallback()
  init()
})

watch(
  () => authorizationInfo.authorizing,
  (nv) => {
    if (nv) {
      store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
        authorizing: false
      })
      onGitHubAuthorizeLogin()
    }
  }
)
</script>

<style scoped lang="stylus">
@import "./picx-login.styl"
</style>
