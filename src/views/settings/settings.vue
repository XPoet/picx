<template>
  <div class="page-container settings-page-container">
    <div class="setting-title">个性设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-switch
          v-model="userConfigInfo.personalSetting.defaultHash"
          @change="switchChange"
          active-text="上传时默认给图片加上哈希码"
        ></el-switch>
      </li>
      <li class="setting-item">
        <el-switch
          v-model="userConfigInfo.personalSetting.defaultMarkdown"
          @change="switchChange"
          active-text="上传后默认开启 Markdown 格式的外链"
        ></el-switch>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { store } from '@/store'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const switchChange = () => {
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<style scoped lang="stylus">
@import "settings.styl"
</style>
