<template>
  <div class="page-container github-authorize-container">
    <el-button plain @click="qs"> Query </el-button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import router from '@/router'

onMounted(() => {
  console.log(router.currentRoute.value)
})

const qs = () => {
  console.log(router.currentRoute.value)
}
</script>

<style scoped lang="stylus">
@import "github-authorize.styl"
</style>
