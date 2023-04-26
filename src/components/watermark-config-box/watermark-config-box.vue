<template>
  <el-form label-position="left" label-width="90rem">
    <el-row>
      <el-col :span="24">
        <el-form-item label="水印文字">
          <el-input
            v-model="watermark.text"
            placeholder="请输入水印文字，限制 20 字"
            clearable
            maxlength="20"
            @input="changeWatermarkConfig"
          />
        </el-form-item>
      </el-col>

      <el-col :span="isTool ? 10 : 24">
        <el-form-item label="字体大小">
          <el-input-number
            v-model="watermark.fontSize"
            :min="40"
            :max="80"
            :step="2"
            @change="changeWatermarkConfig"
          />
        </el-form-item>
      </el-col>

      <el-col :span="isTool ? 14 : 24">
        <el-form-item label="水印颜色">
          <el-color-picker v-model="watermark.textColor" @change="changeWatermarkConfig" />
        </el-form-item>
      </el-col>

      <el-col :span="isTool ? 10 : 24">
        <el-form-item label="水印透明度">
          <el-input-number
            v-model="watermark.opacity"
            :precision="1"
            :step="0.1"
            :min="0.1"
            :max="0.9"
            @change="changeWatermarkConfig"
          />
        </el-form-item>
      </el-col>

      <el-col :span="isTool ? 14 : 24">
        <el-form-item label="水印位置">
          <el-radio-group v-model="watermark.position" @change="changeWatermarkConfig">
            <el-radio :label="WatermarkPositionEnum.leftTop">左上角</el-radio>
            <el-radio :label="WatermarkPositionEnum.leftBottom">左下角</el-radio>
            <el-radio :label="WatermarkPositionEnum.rightTop">右上角</el-radio>
            <el-radio :label="WatermarkPositionEnum.rightBottom">右下角</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { store } from '@/store'
import { WatermarkPositionEnum } from '@/common/model'

const watermark = reactive({
  text: '',
  fontSize: 0,
  position: WatermarkPositionEnum.rightBottom,
  textColor: '',
  opacity: 0
})

defineProps({
  isTool: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['watermarkConfig'])

const changeWatermarkConfig = () => {
  emit('watermarkConfig', watermark)
}

onMounted(() => {
  const initWatermark = store.getters.getUserSettings.watermark
  watermark.text = initWatermark.text
  watermark.textColor = initWatermark.textColor
  watermark.fontSize = initWatermark.fontSize
  watermark.position = initWatermark.position
  watermark.opacity = initWatermark.opacity
  emit('watermarkConfig', watermark)
})
</script>
