<template>
  <div
    v-if="isShowBar"
    class="cloud-settings-data-box status-bar info"
    :class="{
      warning: selectedAction === CloudSettingsActions.update,
      success: selectedAction === CloudSettingsActions.equal
    }"
  >
    <div>{{ actionsTip }}</div>
    <el-button
      type="primary"
      text
      :icon="icon.IEpCheck"
      :loading="saveLoading"
      :disabled="saveDisabled"
      @click="onConfirm"
    >
      {{ $t('confirm') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { store } from '@/stores'
import { deepAssignObject, deepObjectEqual } from '@/utils'
import { CloudSettingsActions } from './cloud-settings-bar.model'
import { getCloudSettings, saveCloudSettings } from './cloud-settings-bar.util'
import i18n from '@/plugins/vue/i18n'

const icon = shallowRef({ IEpCheck, IEpClose })
const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const saveLoading = ref(false)
const saveDisabled = ref(false)
const selectedAction = ref<CloudSettingsActions>(CloudSettingsActions.save)

const actionsTip = computed(() => {
  switch (selectedAction.value) {
    case CloudSettingsActions.save:
      return i18n.global.t('settings_page.cloud_settings.tip_1')

    case CloudSettingsActions.use:
      return i18n.global.t('settings_page.cloud_settings.tip_2')

    case CloudSettingsActions.update:
      return i18n.global.t('settings_page.cloud_settings.tip_3')

    case CloudSettingsActions.equal:
      return i18n.global.t('settings_page.cloud_settings.tip_4')

    default:
      return i18n.global.t('settings_page.cloud_settings.tip_1')
  }
})

const isShowBar = ref(false)

// 保存（更新）到云端
const saveToCloud = async () => {
  saveLoading.value = true
  await saveCloudSettings(userSettings, userConfigInfo)
  saveLoading.value = false
  ElMessage.success(
    store.getters.getCloudSettings === null
      ? i18n.global.t('settings_page.cloud_settings.success_msg_1')
      : i18n.global.t('settings_page.cloud_settings.success_msg_2')
  )
  await store.dispatch('SET_CLOUD_SETTINGS', JSON.parse(JSON.stringify(userSettings)))
}

// 使用云端设置数据
const useCloudSettings = () => {
  if (store.getters.getCloudSettings) {
    deepAssignObject(userSettings, store.getters.getCloudSettings)
    store.dispatch('USER_SETTINGS_PERSIST')
    store.dispatch('SET_GLOBAL_SETTINGS', {
      useCloudSettings: true
    })
  }
}

// 初始化云端设置数据
const initCloudSettings = async () => {
  const res = await getCloudSettings(userConfigInfo)
  isShowBar.value = true
  await store.dispatch('SET_CLOUD_SETTINGS', res ? JSON.parse(window.atob(res.content)) : null)
}

// 确定操作
const onConfirm = () => {
  // eslint-disable-next-line default-case
  switch (selectedAction.value) {
    case CloudSettingsActions.save:
    case CloudSettingsActions.update:
      saveToCloud()
      break

    case CloudSettingsActions.use:
      useCloudSettings()
      break
  }
}

watch(
  () => userSettings,
  (us) => {
    if (store.getters.getCloudSettings) {
      // 本地设置发生变化时，判断和云端设置是否相等
      if (deepObjectEqual(us, store.getters.getCloudSettings)) {
        // 相等情况
        selectedAction.value = CloudSettingsActions.equal
        saveDisabled.value = true
      } else {
        // 不相等情况
        selectedAction.value = CloudSettingsActions.update
        saveDisabled.value = false
      }
    }
  },
  {
    deep: true
  }
)

watch(
  () => store.getters.getCloudSettings,
  (cs) => {
    // 存在云端设置数据
    if (cs) {
      // 已使用
      if (store.getters.getGlobalSettings.useCloudSettings) {
        // 判断 云端数据 和 本地数据 是否相等，相等则禁止点击
        if (deepObjectEqual(cs, userSettings)) {
          saveDisabled.value = true
          selectedAction.value = CloudSettingsActions.equal
        } else {
          saveDisabled.value = false
          selectedAction.value = CloudSettingsActions.update
        }
      } else if (deepObjectEqual(cs, userSettings)) {
        saveDisabled.value = true
        selectedAction.value = CloudSettingsActions.equal
      } else {
        saveDisabled.value = false
        selectedAction.value = CloudSettingsActions.use
      }
    } else {
      // 不存在云端设置数据，提示是否保存
      selectedAction.value = CloudSettingsActions.save
    }
  },
  {
    deep: true,
    immediate: true
  }
)

onMounted(() => {
  initCloudSettings()
})
</script>

<style scoped lang="stylus">
@import "cloud-settings-bar.styl"
</style>
