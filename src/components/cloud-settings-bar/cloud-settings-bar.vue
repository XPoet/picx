<template>
  <div class="cloud-settings-data-box border-box">
    <div>{{ actionsTip }}</div>
    <el-button
      type="primary"
      text
      :icon="icon.IEpCheck"
      :loading="saveLoading"
      :disabled="saveDisabled"
      @click="onOK"
    >
      {{ $t('confirm') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, shallowRef, watch } from 'vue'
import { store } from '@/stores'
import { UserSettingsModel } from '@/common/model'
import { deepAssignObject, deepObjectEqual } from '@/utils'
import { CloudSettingsActions } from './cloud-settings-bar.model'
import { getCloudSettings, saveCloudSettings } from './cloud-settings-bar.util'

const instance = getCurrentInstance()

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const icon = shallowRef({ IEpCheck, IEpClose })

const cloudSettings = ref<null | UserSettingsModel>(null)
const saveLoading = ref(false)
const saveDisabled = ref(false)

const selectedAction = ref<CloudSettingsActions>(CloudSettingsActions.save)

const actionsTip = computed(() => {
  switch (selectedAction.value) {
    case CloudSettingsActions.save:
      return instance?.proxy?.$t('settings.cloud_settings.tip_1')

    case CloudSettingsActions.use:
      return instance?.proxy?.$t('settings.cloud_settings.tip_2')

    case CloudSettingsActions.update:
      return instance?.proxy?.$t('settings.cloud_settings.tip_3')

    case CloudSettingsActions.equal:
      return instance?.proxy?.$t('settings.cloud_settings.tip_4')

    default:
      return instance?.proxy?.$t('settings.cloud_settings.tip_1')
  }
})

// 保存（更新）到云端
const saveToCloud = async () => {
  saveLoading.value = true
  await saveCloudSettings(userSettings, userConfigInfo)
  saveLoading.value = false
  cloudSettings.value = JSON.parse(JSON.stringify(userSettings))
  ElMessage.success(
    cloudSettings.value === null
      ? instance?.proxy?.$t('settings.cloud_settings.success_msg_1')
      : instance?.proxy?.$t('settings.cloud_settings.success_msg_2')
  )
}

// 使用云端设置数据
const useCloudSettings = () => {
  if (cloudSettings.value) {
    deepAssignObject(userSettings, cloudSettings.value)
    store.dispatch('USER_SETTINGS_PERSIST')
  }
}

// 初始化云端设置数据
const initCloudSettings = async () => {
  const res = await getCloudSettings(userConfigInfo)
  cloudSettings.value = res ? JSON.parse(window.atob(res.content)) : null
}

// 确定操作
const onOK = () => {
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
  (settings) => {
    if (cloudSettings.value) {
      // 本地设置发生变化时，判断和云端设置是否相等
      if (deepObjectEqual(settings, cloudSettings.value)) {
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
  () => cloudSettings.value,
  (settings) => {
    // 不存在云端设置数据，提示是否保存
    if (settings === null) {
      selectedAction.value = CloudSettingsActions.save
    }

    // 存在云端设置数据，提示是否使用
    if (settings) {
      selectedAction.value = CloudSettingsActions.use
    }

    // 判断 云端设置 和本地设置 是否相等，相等则禁止点击
    if (settings && deepObjectEqual(settings, userSettings)) {
      saveDisabled.value = true
      selectedAction.value = CloudSettingsActions.equal
    } else {
      saveDisabled.value = false
      selectedAction.value = CloudSettingsActions.update
    }
  },
  {
    deep: true
  }
)

onMounted(() => {
  initCloudSettings()
})
</script>

<style scoped lang="stylus">
@import "cloud-settings-bar.styl"
</style>
