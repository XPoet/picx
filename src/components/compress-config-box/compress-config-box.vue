<template>
  <div class="compress-config-box">
    <div class="img-encoder-title">选择图片压缩算法：</div>
    <el-radio-group
      :disabled="disabled"
      class="img-encoder-group"
      v-model="compressEncoder"
      @change="onChangeEncoder"
    >
      <el-radio :label="CompressEncoderEnum.webP">
        {{ CompressEncoderEnum.webP }}
        <span class="desc">压缩后图片格式为 webp，压缩率较高，大多数浏览器支持</span>
      </el-radio>
      <el-radio :label="CompressEncoderEnum.mozJPEG">
        {{ CompressEncoderEnum.mozJPEG }}
        <span class="desc">压缩后图片格式为 jpg，兼容性最好，所有浏览器支持</span>
      </el-radio>
      <el-radio :label="CompressEncoderEnum.avif">
        {{ CompressEncoderEnum.avif }}
        <span class="desc">压缩后图片格式为 avif，压缩率极高，部分现代浏览器支持</span>
      </el-radio>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CompressEncoderEnum } from '@/common/model'
import { store } from '@/store'

const userSettings = computed(() => store.getters.getUserSettings).value

const compressEncoder = ref<CompressEncoderEnum>(CompressEncoderEnum.webP)

const emit = defineEmits(['encoder'])

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  usageScenario: {
    type: String as () => 'imageHosting' | 'toolbox',
    default: 'toolbox'
  }
})

const onChangeEncoder = (encoder: CompressEncoderEnum) => {
  emit('encoder', encoder)
}

const reset = () => {
  compressEncoder.value = CompressEncoderEnum.webP
}

onMounted(() => {
  if (props.usageScenario === 'imageHosting') {
    compressEncoder.value = userSettings.compress.encoder
  }
  emit('encoder', compressEncoder.value)
})

defineExpose({ reset })
</script>

<style scoped lang="stylus">
@import "./compress-config-box.styl"
</style>
