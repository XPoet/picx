<script setup lang="ts">
import { computed } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import router from '@/router'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { connectionLocation } from '@/utils/login-navigation'

const picx = usePicxStore(pinia)
const connection = computed(() => picx.connection)
const statusKey = computed(() => connection.value.phase === 'connected'
  ? 'connected'
  : connection.value.phase === 'validating' || connection.value.phase === 'initializing'
    ? 'connecting'
    : connection.value.phase === 'failed' ? 'failed' : 'unverified')
</script>

<template>
  <div class="authorization-status-box status-bar" :class="{ success: connection.phase === 'connected', error: connection.phase === 'failed' }">
    <span>{{ $t(`repository_context.${statusKey}`) }}</span>
    <el-button text type="primary" @click="router.push(connectionLocation('/upload'))">
      <PicxIcon name="refresh-cw" :size="16" />{{ $t('authorization.text_7') }}
    </el-button>
  </div>
</template>

<style scoped lang="stylus">
@import 'authorization-status-bar.styl'
</style>
