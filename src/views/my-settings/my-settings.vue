<template>
  <div class="page-container settings-page-container">
    <cloud-settings-bar style="margin-bottom: 20rem" />

    <el-collapse>
      <!-- 图片名称设置 -->
      <el-collapse-item :title="$t('settings.img_name.title')" name="1">
        <ul class="setting-list" style="margin-top: 10rem">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageName.autoAddHash"
              @change="persistUserSettings"
              :active-text="$t('settings.img_name.hash_switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings.img_name.hash_switch_desc') }}</span>
          </li>
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageName.prefixNaming.enable"
              @change="persistUserSettings"
              :active-text="$t('settings.img_name.prefix_switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings.img_name.prefix_switch_desc') }}</span>
          </li>
          <li class="setting-item has-desc" v-if="userSettings.imageName.prefixNaming.enable">
            <el-input
              class="prefix-input"
              v-model="userSettings.imageName.prefixNaming.prefix"
              :placeholder="$t('settings.img_name.prefix_input_placeholder')"
              @input="persistUserSettings"
              clearable
              autofocus
            ></el-input>
          </li>
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageName.autoTimestampNaming"
              @change="persistUserSettings"
              :active-text="$t('settings.img_name.timestamp_switch_name')"
            ></el-switch>
          </li>
        </ul>
      </el-collapse-item>

      <!-- 图片水印设置 -->
      <el-collapse-item :title="$t('settings.img_watermark.title')" name="2">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.watermark.enable"
              @change="persistUserSettings"
              :active-text="$t('settings.img_watermark.switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings.img_watermark.switch_desc') }}</span>
          </li>
          <li class="setting-item">
            <el-card class="settings-item-card">
              <watermark-config-box
                :disabled="!userSettings.watermark.enable"
                @watermarkConfig="setWatermarkConfig"
              />
            </el-card>
          </li>
        </ul>
      </el-collapse-item>

      <!-- 图片压缩设置 -->
      <el-collapse-item :title="$t('settings.img_compress.title')" name="3">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.compress.enable"
              @change="persistUserSettings"
              :active-text="$t('settings.img_compress.switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings.img_compress.switch_desc') }}</span>
          </li>
          <li class="setting-item">
            <el-card class="settings-item-card">
              <compress-config-box
                ref="compressConfigBoxRef"
                usage-scenario="imageHosting"
                :disabled="!userSettings.compress.enable"
                @encoder=";(userSettings.compress.encoder = $event), persistUserSettings()"
              />
            </el-card>
          </li>
        </ul>
      </el-collapse-item>

      <!-- 图片链接规则配置 -->
      <el-collapse-item :title="$t('settings.link_rule.title')" name="4">
        <ul class="setting-list">
          <li class="setting-item cdn">
            {{ $t('settings.link_rule.select_title') }}：
            <el-select v-model="userSettings.imageLinkType.selected" @change="saveUserSettings">
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
          </li>
          <li class="setting-item" style="margin-top: 20rem">
            <image-link-rule-config />
          </li>
        </ul>
      </el-collapse-item>

      <!-- 图片链接格式设置 -->
      <el-collapse-item :title="$t('settings.link_format.title')" name="5">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageLinkFormat.enable"
              @change="persistUserSettings"
              :active-text="$t('settings.link_format.switch_name')"
            ></el-switch>
            <span class="desc">
              {{
                $t('settings.link_format.switch_desc', {
                  type: userSettings.imageLinkFormat.selected
                })
              }}
            </span>
          </li>
          <li class="setting-item">
            {{ $t('settings.link_format.select_title') }}：
            <el-select v-model="userSettings.imageLinkFormat.selected" @change="saveUserSettings">
              <el-option
                v-for="(item, idx) in userSettings.imageLinkFormat.presetList"
                :key="idx + item.name"
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
      </el-collapse-item>

      <!-- 图床部署设置 -->
      <el-collapse-item :title="$t('settings.image_hosting_deploy.title')" name="6">
        <image-hosting-deploy />
      </el-collapse-item>

      <!-- 主题设置 -->
      <el-collapse-item :title="$t('settings.theme.title')" name="7">
        <ul class="setting-list">
          <li class="setting-item">
            {{ $t('header.theme') }}：
            <el-select v-model="userSettings.theme.mode" @change="saveUserSettings">
              <el-option
                :label="$t('settings.theme.system')"
                :value="ThemeModeEnum.system"
              ></el-option>
              <el-option
                :label="$t('settings.theme.light')"
                :value="ThemeModeEnum.light"
              ></el-option>
              <el-option :label="$t('settings.theme.dark')" :value="ThemeModeEnum.dark"></el-option>
            </el-select>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { store } from '@/stores'
import { ThemeModeEnum, UserSettingsModel } from '@/common/model'

const userSettings = computed(() => store.getters.getUserSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const saveUserSettings = () => {
  store.dispatch('SET_USER_SETTINGS', {
    ...userSettings
  })
}

const setWatermarkConfig = (config: UserSettingsModel['watermark']) => {
  userSettings.watermark.text = config.text
  userSettings.watermark.textColor = config.textColor
  userSettings.watermark.opacity = config.opacity
  userSettings.watermark.position = config.position
  userSettings.watermark.fontSize = config.fontSize
  persistUserSettings()
}

watch(
  () => userSettings.imageName.autoTimestampNaming,
  (enable) => {
    if (enable) {
      userSettings.imageName.autoAddHash = false
      userSettings.imageName.prefixNaming.enable = false
    } else {
      userSettings.imageName.autoAddHash = true
    }
    persistUserSettings()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<style scoped lang="stylus">
@import "my-settings.styl"
</style>
