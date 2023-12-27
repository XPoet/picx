<template>
  <div
    class="authorization-status-box border-box"
    :class="{
      error: isAutoAuthorize && token && isAuthorizeExpire(),
      warning: isAutoAuthorize && token && !installed,
      success: isAutoAuthorize && token && !isAuthorizeExpire()
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

    <el-tooltip placement="top" :content="$t('authorization.text_6')">
      <el-button type="primary" text :icon="icon.IEpSwitch" @click="onOK">{{
        $t('authorization.text_7')
      }}</el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { onMounted, shallowRef, computed } from 'vue'
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

onMounted(() => {})
</script>

<style scoped lang="stylus">
@import "authorization-status-bar.styl"
</style>
