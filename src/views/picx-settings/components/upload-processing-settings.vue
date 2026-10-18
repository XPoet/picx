<script setup lang="ts">
import type { UserSettingsModel } from '@/common/model'
import { computed } from 'vue'
import { store } from '@/stores'

const userSettings = computed(() => store.getters.getUserSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

// 时间戳命名与哈希化、添加前缀互斥
const onTimestampNamingChange = () => {
  if (userSettings.imageName.enableTimestamp) {
    userSettings.imageName.enableHash = false
    userSettings.imageName.addPrefix.enable = false
  }
  persistUserSettings()
}

const onHashNamingChange = () => {
  if (userSettings.imageName.enableHash) {
    userSettings.imageName.enableTimestamp = false
  }
  persistUserSettings()
}

const onPrefixNamingChange = () => {
  if (userSettings.imageName.addPrefix.enable) {
    userSettings.imageName.enableTimestamp = false
  }
  persistUserSettings()
}

const setWatermarkConfig = (config: UserSettingsModel['watermark']) => {
  userSettings.watermark.text = config.text
  userSettings.watermark.textColor = config.textColor
  userSettings.watermark.opacity = config.opacity
  userSettings.watermark.position = config.position
  userSettings.watermark.fontSize = config.fontSize
  userSettings.watermark.rotate = config.rotate
  userSettings.watermark.gap = config.gap
  persistUserSettings()
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
    <div class="settings-grid">
      <article class="settings-card">
        <h2>{{ $t('settings_page.img_name.title') }}</h2>
        <div class="settings-switch-row">
          <span>{{ $t('settings_page.img_name.hash_switch_name') }}</span><el-switch v-model="userSettings.imageName.enableHash" :aria-label="$t('settings_page.img_name.hash_switch_name')" @change="onHashNamingChange" />
        </div>
        <div class="settings-switch-row">
          <span>{{ $t('settings_page.img_name.timestamp_switch_name') }}</span><el-switch v-model="userSettings.imageName.enableTimestamp" :aria-label="$t('settings_page.img_name.timestamp_switch_name')" @change="onTimestampNamingChange" />
        </div>
        <p>{{ $t('settings_page.img_name.timestamp_switch_desc') }}</p>
      </article>
      <article class="settings-card">
        <div class="settings-switch-row">
          <h2>{{ $t('settings_page.img_name.prefix_switch_name') }}</h2><el-switch v-model="userSettings.imageName.addPrefix.enable" :aria-label="$t('settings_page.img_name.prefix_switch_name')" @change="onPrefixNamingChange" />
        </div>
        <p>{{ $t('settings_page.img_name.prefix_switch_desc') }}</p>
        <el-input v-model="userSettings.imageName.addPrefix.prefix" :disabled="!userSettings.imageName.addPrefix.enable" :aria-label="$t('settings_page.img_name.prefix_switch_name')" :placeholder="$t('settings_page.img_name.prefix_input_placeholder')" clearable @input="persistUserSettings" />
      </article>
    </div>
    <article class="settings-card">
      <div class="settings-switch-row">
        <div><h2>{{ $t('settings_page.img_compress.title') }}</h2><p>{{ $t('settings_page.img_compress.switch_desc') }}</p></div><el-switch v-model="userSettings.compress.enable" :aria-label="$t('settings_page.img_compress.switch_name')" @change="persistUserSettings" />
      </div>
      <compress-config-box usage-scenario="imageHosting" :disabled="!userSettings.compress.enable" @encoder=";((userSettings.compress.encoder = $event), persistUserSettings())" />
    </article>
    <article class="settings-card">
      <div class="settings-switch-row">
        <div><h2>{{ $t('settings_page.img_watermark.title') }}</h2><p>{{ $t('settings_page.img_watermark.switch_desc') }}</p></div><el-switch v-model="userSettings.watermark.enable" :aria-label="$t('settings_page.img_watermark.switch_name')" @change="persistUserSettings" />
      </div>
      <watermark-config-box :disabled="!userSettings.watermark.enable" @watermark-config="setWatermarkConfig" />
    </article>
  </section>
</template>
