<template>
  <div class="page-container settings-page-container">
    <div class="setting-title">{{ $t('uptitle1') }}</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-switch
          v-model="userSettings.defaultHash"
          @change="persistUserSettings"
          :active-text="i18nUploadConfig().upli1"
        ></el-switch>
      </li>
      <li class="setting-item">
        <el-switch
          v-model="userSettings.defaultPrefix"
          @change="persistUserSettings"
          :active-text="i18nUploadConfig().upli2"
        ></el-switch>
        <el-input
          class="prefix-input"
          v-if="userSettings.defaultPrefix"
          v-model="userSettings.prefixName"
          :placeholder="i18nUploadConfig().upli3"
          @input="persistUserSettings"
          clearable
          autofocus
        ></el-input>
      </li>
      <li class="setting-item">
        <el-switch
          v-model="userSettings.enableImageLinkFormat"
          @change="persistUserSettings"
          :active-text="
            i18nUploadConfig().upli4 +
            userSettings.imageLinkFormat.selected +
            i18nUploadConfig().upli5
          "
        ></el-switch>
      </li>
    </ul>

    <div class="setting-title">{{ $t('linkTitle') }}</div>
    <ul class="setting-list">
      <li class="setting-item cdn">
        <el-select
          v-model="userSettings.imageLinkType.selected"
          :placeholder="i18nLinkConfig().lkLi1"
          @change="saveUserSettings"
        >
          <el-option
            v-for="item in userSettings.imageLinkType.presetList"
            :key="item.name + '-' + item.id"
            :label="item.name"
            :value="item.name"
            class="image-link-type-rule-option"
          >
            <span class="left">{{ item.name }}</span>
            <span class="right">{{ item.rule }}</span>
          </el-option>
        </el-select>
        <el-tooltip
          :content="
            (isAddRule ? i18nLinkConfig().lkLi2 : i18nLinkConfig().lkLi3) + '自定义图片链接规则'
          "
          placement="top"
        >
          <el-icon class="add-image-link-type-rule" @click="toggleShowImageLinkRuleCard">
            <Remove v-if="isAddRule" />
            <CirclePlus v-else />
          </el-icon>
        </el-tooltip>
      </li>
      <li class="setting-item" v-if="isAddRule">
        <image-link-rule-config />
      </li>
    </ul>

    <div class="setting-title">{{ $t('formatTitle') }}</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-select
          v-model="userSettings.imageLinkFormat.selected"
          :placeholder="i18nFormatConfig().formatLi1"
          @change="saveUserSettings"
        >
          <el-option
            v-for="item in userSettings.imageLinkFormat.presetList"
            :key="item.name"
            :label="item.name"
            :value="item.name"
            class="image-link-type-rule-option"
          >
            <span class="left">{{ item.name }}</span>
            <span class="right">{{ item.format }}</span>
          </el-option>
        </el-select>
      </li>
    </ul>

    <div class="setting-title">{{ $t('compressTitle') }}</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-switch
          v-model="userSettings.isCompress"
          @change="persistUserSettings"
          :active-text="i18nFormatConfig().comli1"
        ></el-switch>
      </li>
      <li class="setting-item">
        <div class="img-encoder-title">{{ $t('comli2') }}</div>
        <el-radio-group
          :disabled="!userSettings.isCompress"
          v-model="userSettings.compressEncoder"
          @change="persistUserSettings"
        >
          <el-radio :label="compressEncoder.webP">
            {{ compressEncoder.webP }} {{ $t('comli3') }}
          </el-radio>
          <el-radio :label="compressEncoder.mozJPEG">
            {{ compressEncoder.mozJPEG }} {{ $t('comli4') }}
          </el-radio>
          <el-radio :label="compressEncoder.avif">
            {{ compressEncoder.avif }}
            {{ $t('comli5') }}
          </el-radio>
        </el-radio-group>
      </li>
    </ul>

    <div class="setting-title">{{ $t('themeTitle') }}</div>
    <ul class="setting-list">
      <li class="setting-item">
        <el-select
          v-model="userSettings.themeMode"
          :placeholder="i18nThemeConfig().themeli1"
          @change="saveUserSettings"
        >
          <el-option :label="i18nThemeConfig().themeli2" value="auto"></el-option>
          <el-option :label="i18nThemeConfig().themeli3" value="dark"></el-option>
          <el-option :label="i18nThemeConfig().themeli4" value="light"></el-option>
        </el-select>
      </li>
    </ul>

    <div class="setting-title" v-if="userSettings.themeMode === 'auto'">{{ $t('themeli5') }}</div>
    <ul class="setting-list" v-if="userSettings.themeMode === 'auto'">
      <li class="setting-item">
        <el-form ref="form">
          <el-form-item>
            <el-time-select
              v-model="userSettings.autoLightThemeTime[0]"
              start="00:00"
              step="00:30"
              end="23:59"
              @change="saveUserSettings"
            ></el-time-select>
            <span class="time-middle-space"> ~ </span>
            <el-time-select
              v-model="userSettings.autoLightThemeTime[1]"
              :start="userSettings.autoLightThemeTime[0]"
              step="00:30"
              end="23:59"
              @change="saveUserSettings"
            ></el-time-select>
          </el-form-item>
        </el-form>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, getCurrentInstance } from 'vue'
import { store } from '@/store'
import { CompressEncoderEnum } from '@/common/model'
import ImageLinkRuleConfig from '@/components/image-link-rule-config/image-link-rule-config.vue'

const instance = getCurrentInstance()
const userSettings = computed(() => store.getters.getUserSettings).value
const isAddRule = ref<boolean>(false)

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const compressEncoder = CompressEncoderEnum

const saveUserSettings = () => {
  store.dispatch('SET_USER_SETTINGS', {
    ...userSettings
  })
  persistUserSettings()
}

const toggleShowImageLinkRuleCard = () => {
  isAddRule.value = !isAddRule.value
}

const i18nUploadConfig = () => {
  return {
    upli1: instance?.proxy?.$t('upli1'),
    upli2: instance?.proxy?.$t('upli2'),
    upli3: instance?.proxy?.$t('upli3'),
    upli4: instance?.proxy?.$t('upli4'),
    upli5: instance?.proxy?.$t('upli5')
  }
}
const i18nLinkConfig = () => {
  return {
    lkLi1: instance?.proxy?.$t('lkLi1'),
    lkLi2: instance?.proxy?.$t('lkLi2'),
    lkLi3: instance?.proxy?.$t('lkLi3'),
    lkLi4: instance?.proxy?.$t('lkLi4')
  }
}
const i18nFormatConfig = () => {
  return {
    formatLi1: instance?.proxy?.$t('formatLi1'),
    comli1: instance?.proxy?.$t('comli1'),
    comli2: instance?.proxy?.$t('comli2'),
    comli3: instance?.proxy?.$t('comli3'),
    comli4: instance?.proxy?.$t('comli4'),
    comli5: instance?.proxy?.$t('comli5')
  }
}
const i18nThemeConfig = () => {
  return {
    themeli1: instance?.proxy?.$t('themeli1'),
    themeli2: instance?.proxy?.$t('themeli2'),
    themeli3: instance?.proxy?.$t('themeli3'),
    themeli4: instance?.proxy?.$t('themeli4')
  }
}
</script>

<style scoped lang="stylus">
@import "my-settings.styl"
</style>
