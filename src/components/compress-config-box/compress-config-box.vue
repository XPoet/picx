<template>
  <div class="compress-config-box">
    <div class="img-encoder-title">{{ $t('settings.img_compress.radio_group_title') }}</div>
    <el-radio-group
      :disabled="disabled"
      class="img-encoder-group"
      v-model="compressEncoder"
      @change="onChangeEncoder"
    >
      <el-radio :label="CompressEncoderEnum.webP">
        {{ CompressEncoderEnum.webP }}
        <span class="desc">{{ $t('settings.img_compress.radio_1_desc') }}</span>
      </el-radio>
      <el-radio :label="CompressEncoderEnum.mozJPEG">
        {{ CompressEncoderEnum.mozJPEG }}
        <span class="desc">{{ $t('settings.img_compress.radio_2_desc') }}</span>
      </el-radio>
      <el-radio :label="CompressEncoderEnum.avif">
        {{ CompressEncoderEnum.avif }}
        <span class="desc">{{ $t('settings.img_compress.radio_3_desc') }}</span>
      </el-radio>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CompressEncoderEnum } from '@/common/model'
import { store } from '@/stores'

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
