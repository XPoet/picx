<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CompressEncoderEnum } from '@/common/model'
import { store } from '@/stores'

const props = withDefaults(defineProps<{
  disabled?: boolean
  usageScenario?: 'imageHosting' | 'toolbox'
  modelValue?: CompressEncoderEnum
}>(), { disabled: false, usageScenario: 'toolbox' })
const emit = defineEmits<{ encoder: [encoder: CompressEncoderEnum] }>()

const userSettings = computed(() => store.getters.getUserSettings).value

const compressEncoder = ref<CompressEncoderEnum>(CompressEncoderEnum.original)

const onChangeEncoder = (encoder: string | number | boolean | undefined) => {
  if (typeof encoder === 'string' && Object.values<string>(CompressEncoderEnum).includes(encoder)) {
    emit('encoder', encoder as CompressEncoderEnum)
  }
}

const reset = () => {
  compressEncoder.value = CompressEncoderEnum.original
  emit('encoder', compressEncoder.value)
}

watch(() => props.modelValue, (value) => {
  if (value !== undefined)
    compressEncoder.value = value
}, { immediate: true })

onMounted(() => {
  if (props.modelValue !== undefined)
    return
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
      <el-radio :value="CompressEncoderEnum.original">
        {{ $t('settings_page.img_compress.original') }}
        <span class="desc">{{ $t('settings_page.img_compress.original_desc') }}</span>
      </el-radio>
      <el-radio :value="CompressEncoderEnum.webP">
        {{ CompressEncoderEnum.webP }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_1_desc') }}</span>
      </el-radio>
      <el-radio :value="CompressEncoderEnum.mozJPEG">
        {{ CompressEncoderEnum.mozJPEG }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_2_desc') }}</span>
      </el-radio>
      <el-radio :value="CompressEncoderEnum.avif">
        {{ CompressEncoderEnum.avif }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_3_desc') }}</span>
      </el-radio>
      <el-radio :value="CompressEncoderEnum.png">
        {{ CompressEncoderEnum.png }}
        <span class="desc">{{ $t('settings_page.img_compress.radio_4_desc') }}</span>
      </el-radio>
    </el-radio-group>
  </div>
</template>

<style scoped lang="stylus">
@import "./compress-config-box.styl"
</style>
