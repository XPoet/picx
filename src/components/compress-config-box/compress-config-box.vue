<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CompressEncoderEnum } from '@/common/model'
import { store } from '@/stores'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  usageScenario: {
    type: String as () => 'imageHosting' | 'toolbox',
    default: 'toolbox',
  },
})

const emit = defineEmits(['encoder'])

const userSettings = computed(() => store.getters.getUserSettings).value

const compressEncoder = ref<CompressEncoderEnum>(CompressEncoderEnum.webP)

const onChangeEncoder = (encoder: string | number | boolean | undefined) => {
  if (typeof encoder === 'string' && Object.values<string>(CompressEncoderEnum).includes(encoder)) {
    emit('encoder', encoder)
  }
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

<template>
  <div class="compress-config-box">
    <div class="img-encoder-title">
      {{ $t('settings_page.img_compress.radio_group_title') }}
    </div>
    <el-radio-group
      v-model="compressEncoder"
      :disabled="disabled"
      class="img-encoder-group"
      @change="onChangeEncoder"
    >
      <el-radio :label="CompressEncoderEnum.webP">
        {{ CompressEncoderEnum.webP }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_1_desc') }}</span>
      </el-radio>
      <el-radio :label="CompressEncoderEnum.mozJPEG">
        {{ CompressEncoderEnum.mozJPEG }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_2_desc') }}</span>
      </el-radio>
      <el-radio :label="CompressEncoderEnum.avif">
        {{ CompressEncoderEnum.avif }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_3_desc') }}</span>
      </el-radio>
      <el-radio :label="CompressEncoderEnum.png">
        {{ CompressEncoderEnum.png }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_4_desc') }}</span>
      </el-radio>
    </el-radio-group>
  </div>
</template>

<style scoped lang="stylus">
@import "./compress-config-box.styl"
</style>
