<script setup lang="ts">
import type { UserSettingsModel } from '@/common/model'
import type { NamingMode, UploadPreferencesPatch } from '@/utils/upload-preferences'
import { computed, ref, watch } from 'vue'
import CompressConfigBox from '@/components/compress-config-box/compress-config-box.vue'
import WatermarkConfigBox from '@/components/watermark-config-box/watermark-config-box.vue'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { applyUploadNaming, createNamedUploadImage } from '@/utils/upload-naming'
import { changeNamingMode, namingMode, validPrefix } from '@/utils/upload-preferences'

const store = usePicxStore(pinia)
const settings = computed(() => store.getUserSettings)
const prefix = ref(settings.value.imageName.addPrefix.prefix)
const error = ref(false)
const sample = createNamedUploadImage({ uuid: 'a8f3d2e1-1234-4567-89ab-0123456789ab', base64: '', file: new File([], 'coast.png', { type: 'image/png' }) }, settings.value.imageName)
const preview = computed(() => {
  applyUploadNaming(sample, settings.value.imageName)
  return sample.filename.final
})
watch(() => settings.value.imageName.addPrefix.prefix, value => prefix.value = value)
function save(patch: UploadPreferencesPatch) {
  error.value = !store.SAVE_UPLOAD_PREFERENCES(patch)
}
function setMode(mode: NamingMode) {
  save({ imageName: changeNamingMode(settings.value.imageName, mode) })
}
function commitPrefix() {
  if (!validPrefix(prefix.value)) {
    error.value = true
    return
  }
  save({ imageName: { ...settings.value.imageName, addPrefix: { ...settings.value.imageName.addPrefix, prefix: prefix.value } } })
}
function watermark(config: UserSettingsModel['watermark']) {
  save({ watermark: { ...settings.value.watermark, ...config } })
}
</script>

<template>
  <section aria-labelledby="processing-title" class="settings-section">
    <header class="settings-section-heading">
      <h1 id="processing-title">
        {{ $t('settings_workspace.processing') }}
      </h1>
      <p>{{ $t('settings_workspace.processing_desc') }}</p>
    </header>
    <p v-if="error" role="alert" class="settings-error">
      {{ $t('settings_workspace.invalid_preferences') }}
    </p>
    <div class="settings-grid">
      <article class="settings-card">
        <h2>{{ $t('settings_workspace.naming') }}</h2>
        <p>{{ $t('settings_workspace.naming_desc') }}</p>
        <div class="settings-segments" role="group" :aria-label="$t('settings_workspace.naming')">
          <button v-for="mode in (['hash', 'timestamp', 'original'] as const)" :key="mode" type="button" :aria-pressed="namingMode(settings.imageName) === mode" :disabled="store.uploadTargetBusy" @click="setMode(mode)">
            {{ $t(`settings_workspace.naming_${mode}`) }}
          </button>
        </div>
        <code class="settings-preview" data-testid="naming-preview">{{ preview }}</code>
        <p>{{ $t('settings_workspace.timestamp_hint') }}</p>
      </article>
      <article class="settings-card">
        <div class="settings-switch-row">
          <div><h2>{{ $t('settings_workspace.prefix') }}</h2><p>{{ $t('settings_workspace.prefix_desc') }}</p></div>
          <el-switch :model-value="settings.imageName.addPrefix.enable" :disabled="settings.imageName.enableTimestamp || store.uploadTargetBusy" :aria-label="$t('settings_page.img_name.prefix_switch_name')" @update:model-value="save({ imageName: { ...settings.imageName, addPrefix: { ...settings.imageName.addPrefix, enable: $event === true } } })" />
        </div>
        <el-input v-model="prefix" :disabled="settings.imageName.enableTimestamp || !settings.imageName.addPrefix.enable || store.uploadTargetBusy" :aria-label="$t('settings_workspace.prefix_content')" :placeholder="$t('settings_page.img_name.prefix_input_placeholder')" maxlength="100" @change="commitPrefix" />
        <code class="settings-preview">{{ preview }}</code>
      </article>
    </div>
    <article class="settings-card">
      <div class="settings-switch-row">
        <div><h2>{{ $t('settings_workspace.compress') }}</h2><p>{{ $t('settings_page.img_compress.switch_desc') }}</p></div>
        <el-switch :model-value="settings.compress.enable" :disabled="store.uploadTargetBusy" :aria-label="$t('settings_page.img_compress.switch_name')" @update:model-value="save({ compress: { ...settings.compress, enable: $event === true } })" />
      </div>
      <CompressConfigBox :model-value="settings.compress.encoder" usage-scenario="imageHosting" :disabled="!settings.compress.enable || store.uploadTargetBusy" @encoder="save({ compress: { ...settings.compress, encoder: $event } })" />
    </article>
    <article class="settings-card">
      <div class="settings-switch-row">
        <div><h2>{{ $t('settings_workspace.watermark') }}</h2><p>{{ $t('settings_page.img_watermark.switch_desc') }}</p></div>
        <el-switch :model-value="settings.watermark.enable" :disabled="store.uploadTargetBusy" :aria-label="$t('settings_page.img_watermark.switch_name')" @update:model-value="save({ watermark: { ...settings.watermark, enable: $event === true } })" />
      </div>
      <WatermarkConfigBox :model-value="settings.watermark" :disabled="!settings.watermark.enable || store.uploadTargetBusy" @watermark-config="watermark" />
    </article>
  </section>
</template>
