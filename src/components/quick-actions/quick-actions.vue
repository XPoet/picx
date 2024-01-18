<template>
  <el-popover
    v-if="userConfigInfo.logined"
    placement="bottom-end"
    :width="globalSettings.language === 'en' ? '230rem' : '190rem'"
    trigger="click"
    :show-arrow="false"
    :popper-style="{
      padding: '0',
      'border-radius': '10rem',
      overflow: 'hidden'
    }"
  >
    <template #reference>
      <div class="quick-actions border-box">
        <el-icon class="quick-actions-icon">
          <IEpOperation />
        </el-icon>
      </div>
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

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/stores'

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}
</script>

<style scoped lang="stylus">
.quick-actions {
  .quick-actions-icon {
    font-size 24rem
    cursor pointer
  }
}
</style>
