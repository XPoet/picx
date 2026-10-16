<script setup lang="ts">
import { computed } from 'vue'
import { store } from '@/stores'

const userSettings = computed(() => store.getters.getUserSettings).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}
</script>

<template>
  <el-popover
    placement="top-start"
    :width="globalSettings.language === 'en' ? '230rem' : '190rem'"
    trigger="click"
    :show-arrow="false"
    :popper-style="{
      'padding': '0',
      'border-radius': '10rem',
      'overflow': 'hidden',
    }"
  >
    <template #reference>
      <el-button class="quick-actions-btn" circle text :aria-label="$t('nav.actions')" :title="$t('nav.actions')">
        <el-icon :size="22">
          <IEpOperation />
        </el-icon>
      </el-button>
    </template>
    <div class="quick-actions-popover">
      <el-switch
        v-model="userSettings.watermark.enable"
        :active-text="$t('actions.watermark')"
        @change="persistUserSettings"
      />
      <el-switch
        v-model="userSettings.compress.enable"
        :active-text="$t('actions.compress')"
        @change="persistUserSettings"
      />
      <el-switch
        v-model="userSettings.imageLinkFormat.enable"
        :active-text="$t('actions.transform') + userSettings.imageLinkFormat.selected"
        @change="persistUserSettings"
      />
    </div>
  </el-popover>
</template>
