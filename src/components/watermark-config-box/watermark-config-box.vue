<script setup lang="ts">
import type { UserSettingsModel } from '@/common/model'
import { onMounted, reactive, ref, useId, watch } from 'vue'
import { WatermarkPositionEnum } from '@/common/model'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { store } from '@/stores'
import { validWatermark } from '@/utils/upload-preferences'

const props = withDefaults(defineProps<{
  isTool?: boolean
  disabled?: boolean
  modelValue?: UserSettingsModel['watermark']
}>(), { isTool: false, disabled: false })
const emit = defineEmits<{ watermarkConfig: [config: UserSettingsModel['watermark']] }>()
const initial = props.modelValue ?? store.getters.getUserSettings.watermark
const draft = reactive({ ...initial, fontSize: initial.fontSize as number | undefined, opacity: initial.opacity as number | undefined, rotate: initial.rotate as number | undefined, gap: initial.gap as number | undefined })
const id = useId()
const error = ref(false)
const positions = [WatermarkPositionEnum.leftTop, WatermarkPositionEnum.leftBottom, WatermarkPositionEnum.rightTop, WatermarkPositionEnum.rightBottom, WatermarkPositionEnum.fullScreen]
const numbers = [
  { key: 'fontSize', label: 'size', min: 1, max: 200, step: 1 },
  { key: 'opacity', label: 'opacity', min: 0.1, max: 1, step: 0.1 },
  { key: 'rotate', label: 'rotate', min: -45, max: 45, step: 5 },
  { key: 'gap', label: 'gap', min: 20, max: 200, step: 10 },
] as const
watch(() => props.modelValue, (value) => {
  if (value)
    Object.assign(draft, value)
}, { deep: true })
function commit() {
  const { fontSize, opacity, rotate, gap } = draft
  if (typeof fontSize !== 'number' || typeof opacity !== 'number' || typeof rotate !== 'number' || typeof gap !== 'number') {
    error.value = true
    return
  }
  const candidate = { ...draft, fontSize, opacity, rotate, gap }
  error.value = !validWatermark(candidate)
  if (!error.value)
    emit('watermarkConfig', candidate)
}
onMounted(() => {
  if (!props.modelValue)
    commit()
})
</script>

<template>
  <div class="watermark-config-form">
    <div class="watermark-fields">
      <label :for="`${id}-text`">{{ $t('settings_page.img_watermark.text') }}</label>
      <el-input :id="`${id}-text`" v-model="draft.text" :disabled="disabled" :placeholder="$t('settings_page.img_watermark.text_input_placeholder')" maxlength="20" @change="commit" />
      <div class="watermark-numbers">
        <div v-for="field in numbers.filter(field => field.key === 'fontSize' || field.key === 'opacity')" :key="field.key" class="watermark-field">
          <label :for="`${id}-${field.key}`">{{ $t(`settings_page.img_watermark.${field.label}`) }}</label>
          <el-input-number :id="`${id}-${field.key}`" v-model="draft[field.key]" :min="field.min" :max="field.max" :step="field.step" :disabled="disabled" @change="commit">
            <template #decrease-icon>
              <PicxIcon name="minus" :size="16" />
            </template>
            <template #increase-icon>
              <PicxIcon name="plus" :size="16" />
            </template>
          </el-input-number>
        </div>
        <div class="watermark-field">
          <label :for="`${id}-color`">{{ $t('settings_page.img_watermark.color') }}</label>
          <div class="watermark-color">
            <input :id="`${id}-color`" v-model="draft.textColor" type="color" :disabled="disabled" @change="commit"><code>{{ draft.textColor }}</code>
          </div>
        </div>
      </div>
    </div>
    <div class="watermark-fields">
      <span>{{ $t('settings_page.img_watermark.position') }}</span>
      <div class="settings-segments" role="group" :aria-label="$t('settings_page.img_watermark.position')">
        <button v-for="(position, index) in positions" :key="position" type="button" :disabled="disabled" :aria-pressed="draft.position === position" @click="draft.position = position; commit()">
          {{ $t(`settings_page.img_watermark.position_${index + 1}`) }}
        </button>
      </div>
      <div v-if="draft.position === WatermarkPositionEnum.fullScreen" class="watermark-tile">
        <p>{{ $t('settings_workspace.tile_hint') }}</p>
        <div class="watermark-numbers">
          <div v-for="field in numbers.filter(field => field.key === 'rotate' || field.key === 'gap')" :key="field.key" class="watermark-field">
            <label :for="`${id}-${field.key}`">{{ $t(`settings_page.img_watermark.${field.label}`) }}</label>
            <el-input-number :id="`${id}-${field.key}`" v-model="draft[field.key]" :min="field.min" :max="field.max" :step="field.step" :disabled="disabled" @change="commit">
              <template #decrease-icon>
                <PicxIcon name="minus" :size="16" />
              </template>
              <template #increase-icon>
                <PicxIcon name="plus" :size="16" />
              </template>
            </el-input-number>
          </div>
        </div>
      </div>
    </div>
    <p v-if="error" role="alert" class="settings-error">
      {{ $t('settings_workspace.invalid_watermark') }}
    </p>
  </div>
</template>

<style scoped lang="stylus">
.watermark-config-form {
  display grid
  grid-template-columns repeat(2, minmax(0, 1fr))
  gap 24px
  font-size 14px

  .watermark-fields, .watermark-field {
    display grid
    align-content start
    gap 8px
    min-width 0
  }

  .watermark-numbers {
    display flex
    flex-wrap wrap
    gap 16px
    margin-top 12px

    > div {
      flex 1 1 160px
    }
  }

  .el-input-number {
    --el-input-number-controls-width 44px
    width 100%
    height 46px

    :deep(.el-input) {
      height 100%
    }

    :deep(.el-input-number__decrease), :deep(.el-input-number__increase) {
      display flex
      align-items center
      justify-content center
      width 44px
      min-height 44px
    }
  }

  .watermark-color {
    display flex
    align-items center
    gap 8px
    min-height 44px

    input {
      width 44px
      height 44px
      background var(--picx-color-surface)
      border 1px solid var(--picx-color-control-border)
      border-radius var(--picx-radius-control)
    }
  }

  .watermark-tile {
    padding 16px
    background var(--picx-color-surface-muted)
    border-radius var(--picx-radius-control)
  }

  .settings-segments {
    display flex
    flex-wrap wrap
    gap 8px

    button {
      min-width 44px
      min-height 44px
      padding 8px 12px
      color var(--picx-color-text)
      background var(--picx-color-surface)
      border 1px solid var(--picx-color-control-border)
      border-radius var(--picx-radius-control)
      font inherit

      &[aria-pressed='true'] {
        color var(--picx-color-primary)
        background var(--picx-color-primary-soft)
        border-color var(--picx-color-primary)
      }
    }
  }

  @media (max-width 1023px) {
    grid-template-columns minmax(0, 1fr)
  }
}
</style>
