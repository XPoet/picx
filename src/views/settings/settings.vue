<template>
  <div class="page-container settings-page-container">
    <div class="setting-title">个性设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-switch
          v-model="userSettings.defaultHash"
          @change="persistUserSettings"
          active-text="上传时给图片名加上哈希码（确保图片名唯一，强烈建议开启）"
        ></el-switch>
      </li>
      <li class="setting-item">
        <el-switch
          v-model="userSettings.defaultPrefix"
          @change="persistUserSettings"
          active-text="上传时给图片名加上配置的前缀（示例：abc-image.jpg，abc- 为前缀）"
        ></el-switch>
        <el-input
          class="prefix-input"
          v-if="userSettings.defaultPrefix"
          v-model="userSettings.prefixName"
          placeholder="请输入命名前缀"
          @input="persistUserSettings"
          clearable
          autofocus
        ></el-input>
      </li>
      <li class="setting-item">
        <el-switch
          v-model="userSettings.defaultMarkdown"
          @change="persistUserSettings"
          active-text="上传成功后复制的图片外链启用 Markdown 格式（![ ... ]( ... )）"
        ></el-switch>
      </li>
    </ul>

    <div class="setting-title">CDN 提供商：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-select
          v-model="userSettings.externalLinkType"
          placeholder="选择 CDN 提供商"
          @change="saveUserSettings"
        >
          <el-option label="Staticaly" value="staticaly"></el-option>
          <el-option label="Cloudflare" value="cloudflare"></el-option>
          <el-option label="jsDelivr" value="jsdelivr"></el-option>
        </el-select>
      </li>
    </ul>

    <div class="setting-title">压缩设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-switch
          v-model="userSettings.isCompress"
          @change="persistUserSettings"
          active-text="是否压缩图片"
        ></el-switch>
      </li>
      <li class="setting-item">
        <div class="img-encoder-title">选择图像编码器（压缩算法）：</div>
        <el-radio-group
          :disabled="!userSettings.isCompress"
          v-model="userSettings.compressEncoder"
          @change="persistUserSettings"
        >
          <el-radio :label="compressEncoder.webP">
            {{ compressEncoder.webP }} （压缩后图片格式为 webp，大多数现代浏览器支持）
          </el-radio>
          <el-radio :label="compressEncoder.mozJPEG">
            {{ compressEncoder.mozJPEG }} （压缩后图片格式为 jpg，兼容性最好）
          </el-radio>
          <el-radio :label="compressEncoder.avif">
            {{ compressEncoder.avif }}
            （压缩后图片格式为 avif，压缩比最高，目前仅谷歌浏览器支持）
          </el-radio>
        </el-radio-group>
      </li>
    </ul>

    <div class="setting-title">主题设置：</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-select
          v-model="userSettings.themeMode"
          placeholder="主题模式"
          @change="saveUserSettings"
        >
          <el-option label="自动设置" value="auto"></el-option>
          <el-option label="暗夜主题" value="dark"></el-option>
          <el-option label="白昼主题" value="light"></el-option>
        </el-select>
      </li>
    </ul>

    <div class="setting-title" v-if="userSettings.themeMode === 'auto'">
      设置白昼模式时间区间：
    </div>
    <ul class="setting-list" v-if="userSettings.themeMode === 'auto'">
      <li class="setting-item">
        <el-form ref="form">
          <el-form-item>
            <el-time-select
              v-model="userSettings.autoLightThemeTime[0]"
              start="00:00"
              step="00:30"
              end="23:59"
              @change="saveUserSettings"
            ></el-time-select>
            <span class="time-middle-space"> ~ </span>
            <el-time-select
              v-model="userSettings.autoLightThemeTime[1]"
              :start="userSettings.autoLightThemeTime[0]"
              step="00:30"
              end="23:59"
              @change="saveUserSettings"
            ></el-time-select>
          </el-form-item>
        </el-form>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { store } from '@/store'
import { CompressEncoderMap } from '@/utils/compress'

const userSettings = computed(() => store.getters.getUserSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const compressEncoder = CompressEncoderMap

const saveUserSettings = () => {
  store.dispatch('SET_USER_SETTINGS', {
    ...userSettings
  })
  persistUserSettings()
}
</script>

<style scoped lang="stylus">
@import "settings.styl"
</style>
