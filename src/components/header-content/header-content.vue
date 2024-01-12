<template>
  <header class="header-content-box border-box">
    <div class="header-left border-box">
      <div class="brand-box">
        <el-icon class="fold-icon" @click="foldNavBox">
          <IEpExpand v-if="isFolded" />
          <IEpFold v-else />
        </el-icon>
        <div class="logo" @click="router.push('/')">
          <img src="../../assets/logo.png" alt="PicX" />
        </div>
        <div class="title" @click="router.push('/')">PicX</div>
      </div>
    </div>

    <div class="header-right">
      <quick-actions />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores'

const router = useRouter()
const store = useStore()

const isFolded = ref(false)
const foldNavBox = () => {
  isFolded.value = !isFolded.value
  store.dispatch('SET_GLOBAL_SETTINGS', {
    folded: isFolded.value
  })
}
</script>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
