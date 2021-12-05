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
      <li class="setting-item">
        <el-form ref="form" label-width="150px">
          <el-form-item label="主题模式:">
            <el-select
              v-model="userConfigInfo.personalSetting.themeMode"
              placeholder="主题模式"
              @change="saveConfigInfo"
            >
              <el-option label="自适应" value="auto"></el-option>
              <el-option label="暗黑主题" value="dark"></el-option>
              <el-option label="白亮主题" value="light"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            label="自定义白亮主题时间:"
            v-if="userConfigInfo.personalSetting.themeMode === 'auto'"
          >
            <el-time-select
              v-model="userConfigInfo.personalSetting.autoLightThemeDate[0]"
              placeholder=""
              start="00:00"
              step="00:15"
              end="23:59"
              @change="saveConfigInfo"
            ></el-time-select>
            <span class="time-middle-space">--</span>
            <el-time-select
              v-model="userConfigInfo.personalSetting.autoLightThemeDate[1]"
              placeholder="Start time"
              :start="userConfigInfo.personalSetting.autoLightThemeDate[0]"
              step="00:15"
              end="23:59"
              @change="saveConfigInfo"
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

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const switchChange = () => {
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
const saveConfigInfo = () => {
  console.log('userConfigInfo--', userConfigInfo)
  store.dispatch('SET_USER_CONFIG_INFO', {
    ...userConfigInfo,
    personalSetting: {
      ...userConfigInfo.personalSetting
    }
  })
}
</script>

<style scoped lang="stylus">
@import "settings.styl"
</style>
