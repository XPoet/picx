<template>
  <div class="page-container settings-page-container">
    <cloud-settings-bar />

    <el-collapse>
      <!-- 图片名称设置 -->
      <el-collapse-item :title="$t('settings_page.img_name.title')" name="1">
        <ul class="setting-list" style="margin-top: 10rem">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageName.enableHash"
              @change="persistUserSettings"
              :active-text="$t('settings_page.img_name.hash_switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings_page.img_name.hash_switch_desc') }}</span>
          </li>
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageName.addPrefix.enable"
              @change="persistUserSettings"
              :active-text="$t('settings_page.img_name.prefix_switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings_page.img_name.prefix_switch_desc') }}</span>
          </li>
          <li class="setting-item" v-if="userSettings.imageName.addPrefix.enable">
            <el-input
              class="prefix-input"
              v-model="userSettings.imageName.addPrefix.prefix"
              :placeholder="$t('settings_page.img_name.prefix_input_placeholder')"
              @input="persistUserSettings"
              clearable
              autofocus
            ></el-input>
          </li>
        </ul>
      </el-collapse-item>

      <!-- 图片压缩设置 -->
      <el-collapse-item :title="$t('settings_page.img_compress.title')" name="3">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.compress.enable"
              @change="persistUserSettings"
              :active-text="$t('settings_page.img_compress.switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings_page.img_compress.switch_desc') }}</span>
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

      <!-- 图片水印设置 -->
      <el-collapse-item :title="$t('settings_page.img_watermark.title')" name="2">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.watermark.enable"
              @change="persistUserSettings"
              :active-text="$t('settings_page.img_watermark.switch_name')"
            ></el-switch>
            <span class="desc">{{ $t('settings_page.img_watermark.switch_desc') }}</span>
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

      <!-- 图片链接规则配置 -->
      <el-collapse-item :title="$t('settings_page.link_rule.title')" name="4">
        <ul class="setting-list">
          <li class="setting-item cdn">
            {{ $t('settings_page.link_rule.select_title') }}：
            <el-select v-model="userSettings.imageLinkType.selected" @change="saveUserSettings">
              <el-option
                v-for="item in userSettings.imageLinkType.presetList"
                :key="item.name + '-' + item.id"
                :label="item.name"
                :value="item.name"
                :disabled="isGitHubPagesDeployed(item.name)"
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
      <el-collapse-item :title="$t('settings_page.link_format.title')" name="5">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageLinkFormat.enable"
              @change="persistUserSettings"
              :active-text="$t('settings_page.link_format.switch_name')"
            ></el-switch>
            <span class="desc">
              {{
                $t('settings_page.link_format.switch_desc', {
                  type: userSettings.imageLinkFormat.selected
                })
              }}
            </span>
          </li>
          <li class="setting-item">
            {{ $t('settings_page.link_format.select_title') }}：
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
      <el-collapse-item :title="$t('settings_page.image_hosting_deploy.title')" name="6">
        <deploy-status-bar />
      </el-collapse-item>

      <!-- 主题设置 -->
      <el-collapse-item :title="$t('settings_page.theme.title')" name="7">
        <ul class="setting-list">
          <li class="setting-item">
            {{ $t('header.theme') }}：
            <el-select v-model="globalSettings.theme" @change="persistGlobalSettings">
              <el-option
                :label="$t('settings_page.theme.system')"
                :value="ThemeModeEnum.system"
              ></el-option>
              <el-option
                :label="$t('settings_page.theme.light')"
                :value="ThemeModeEnum.light"
              ></el-option>
              <el-option
                :label="$t('settings_page.theme.dark')"
                :value="ThemeModeEnum.dark"
              ></el-option>
            </el-select>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { store } from '@/stores'
import { ImageLinkTypeEnum, ThemeModeEnum, UserSettingsModel } from '@/common/model'

const userSettings = computed(() => store.getters.getUserSettings).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value
const deployStatusInfo = computed(() => store.getters.getDeployStatusInfo).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const persistGlobalSettings = () => {
  store.dispatch('USER_GLOBAL_PERSIST')
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

const isGitHubPagesDeployed = (name: string) => {
  return name === ImageLinkTypeEnum.GitHubPages && !deployStatusInfo.github.status
}
</script>

<style scoped lang="stylus">
@import "picx-settings.styl"
</style>
