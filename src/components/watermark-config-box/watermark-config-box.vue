<template>
  <el-form label-position="left" label-width="120rem" :class="{ 'watermark-tool': isTool }">
    <el-form-item label="水印文字">
      <el-input
        v-model="userSettings.watermark.text"
        placeholder="请输入水印文字，长度不超过20"
        clearable
        maxlength="20"
        @input="persistUserSettings"
      />
    </el-form-item>
    <el-form-item label="字体大小">
      <el-input-number
        v-model="userSettings.watermark.fontSize"
        :min="40"
        :max="60"
        :step="2"
        @change="persistUserSettings"
      />
    </el-form-item>
    <el-form-item label="水印位置">
      <el-radio-group v-model="userSettings.watermark.position" @change="persistUserSettings">
        <el-radio :label="WatermarkPositionEnum.leftTop">左上角</el-radio>
        <el-radio :label="WatermarkPositionEnum.leftBottom">左下角</el-radio>
        <el-radio :label="WatermarkPositionEnum.rightTop">右上角</el-radio>
        <el-radio :label="WatermarkPositionEnum.rightBottom">右下角</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="水印颜色">
      <el-color-picker
        v-model="userSettings.watermark.textColor"
        @active-change="persistUserSettings"
      />
    </el-form-item>
    <el-form-item label="水印透明度">
      <el-input-number
        v-model="userSettings.watermark.opacity"
        :precision="1"
        :step="0.1"
        :min="0.1"
        :max="0.9"
        @change="persistUserSettings"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { store } from '@/store'
import { WatermarkPositionEnum } from '@/common/model'

const userSettings = computed(() => store.getters.getUserSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

defineProps({
  isTool: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped lang="stylus">
@import "./watermark-config-box.styl"
</style>
