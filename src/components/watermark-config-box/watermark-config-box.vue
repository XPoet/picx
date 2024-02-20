<template>
  <el-form
    class="watermark-config-form"
    label-position="left"
    label-width="90rem"
    :disabled="disabled"
  >
    <el-row>
      <el-col :span="24">
        <el-form-item :label="$t('settings_page.img_watermark.text')">
          <el-input
            v-model="watermark.text"
            :placeholder="$t('settings_page.img_watermark.text_input_placeholder')"
            clearable
            maxlength="20"
            @input="changeWatermarkConfig"
          />
        </el-form-item>
      </el-col>

      <el-col :span="isTool ? 10 : 24">
        <el-form-item :label="$t('settings_page.img_watermark.size')">
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
        <el-form-item :label="$t('settings_page.img_watermark.color')">
          <el-color-picker v-model="watermark.textColor" @change="changeWatermarkConfig" />
        </el-form-item>
      </el-col>

      <el-col :span="isTool ? 10 : 24">
        <el-form-item :label="$t('settings_page.img_watermark.opacity')">
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
        <el-form-item :label="$t('settings_page.img_watermark.position')">
          <el-radio-group v-model="watermark.position" @change="changeWatermarkConfig">
            <el-radio :label="WatermarkPositionEnum.leftTop">
              {{ $t('settings_page.img_watermark.position_1') }}
            </el-radio>
            <el-radio :label="WatermarkPositionEnum.leftBottom">
              {{ $t('settings_page.img_watermark.position_2') }}
            </el-radio>
            <el-radio :label="WatermarkPositionEnum.rightTop">
              {{ $t('settings_page.img_watermark.position_3') }}
            </el-radio>
            <el-radio :label="WatermarkPositionEnum.rightBottom">
              {{ $t('settings_page.img_watermark.position_4') }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { store } from '@/stores'
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
  },
  disabled: {
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
