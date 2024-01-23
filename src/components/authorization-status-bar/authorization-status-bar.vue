<template>
  <div
    class="authorization-status-box status-bar"
    :class="{
      success: isAutoAuthorize && token && !isAuthorizeExpire(),
      warning: isAutoAuthorize && token && !isAuthorizeExpire() && installed === false,
      error: isAutoAuthorize && token && isAuthorizeExpire()
    }"
  >
    <div>
      <span v-if="isAutoAuthorize">
        <span v-if="isAuthorizeExpire()">
          {{ $t('authorization.text_4') }}
        </span>
        <span v-else>{{ $t('authorization.text_3') }}</span>
      </span>
      <span v-else>{{ $t('authorization.text_5') }}</span>
    </div>

    <el-button text type="primary" :icon="icon.IEpSwitch" @click="onOK">
      {{ $t('authorization.text_7') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, computed } from 'vue'
import router from '@/router'
import { store } from '@/stores'
import { isAuthorizeExpire } from '@/views/picx-login/picx-login.util'

const icon = shallowRef({ IEpCheck, IEpClose, IEpSwitch })

const { token, isAutoAuthorize, installed } = computed(
  () => store.getters.getGitHubAuthorizationInfo
).value

const onOK = () => {
  router.push({ path: '/login', query: { jump: '0' } })
}
</script>

<style scoped lang="stylus">
@import "authorization-status-bar.styl"
</style>
