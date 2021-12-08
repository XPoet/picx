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
    <div class="setting-title">压缩设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-switch
          v-model="userConfigInfo.personalSetting.defaultCompress"
          @change="switchChange"
          active-text="是否压缩图片"
        ></el-switch>
      </li>
      <li class="setting-item">
        压缩方式：
        <el-radio-group
          :disabled="!userConfigInfo.personalSetting.defaultCompress"
          v-model="userConfigInfo.personalSetting.defaultCompressMethod"
        >
          <el-radio :label="CompressMethods.mozJPEG">
            {{ CompressMethods.mozJPEG }} (产物为 JPEG ，兼容性好)
          </el-radio>
          <el-radio :label="CompressMethods.avif">
            {{ CompressMethods.avif }} (最新格式，效率极高，压缩产物目前仅谷歌浏览器支持)
          </el-radio>
          <el-radio :label="CompressMethods.webP">
            {{ CompressMethods.webP }} (现代浏览器支持)
          </el-radio>
        </el-radio-group>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { store } from '@/store'
import { CompressMethod } from '@/common/utils/compress'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const switchChange = () => {
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
const CompressMethods = CompressMethod
</script>

<style scoped lang="stylus">
@import "settings.styl"
</style>
