<script lang="ts" setup>
import type { UserSettingsModel } from '@/common/model'
import { computed, ref } from 'vue'
import { isBranchExist, isValidCustomDomain, normalizeCustomDomain } from '@/common/api'
import { GH_PAGES } from '@/common/constant'
import { ImageLinkTypeEnum, ThemeModeEnum } from '@/common/model'
import { deployGhPages } from '@/components/deploy-status-bar/deploy-status-bar.util'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const persistGlobalSettings = () => {
  store.dispatch('USER_GLOBAL_PERSIST')
}

const saveUserSettings = () => {
  store.dispatch('SET_USER_SETTINGS', {
    ...userSettings,
  })
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

// 上一次有效的图片链接规则，选择 GitHub Pages 但远端未部署 gh-pages 时用于回退
const lastValidLinkType = ref(userSettings.imageLinkType.selected)

const onImageLinkTypeChange = async (name: string) => {
  if (name !== ImageLinkTypeEnum.GitHubPages) {
    lastValidLinkType.value = name
    saveUserSettings()
    return
  }

  // 选择 GitHub Pages 时，先检查远端图床仓库是否已部署 gh-pages 分支
  const deployed = await isBranchExist(userConfigInfo.owner, userConfigInfo.repo, GH_PAGES)

  // 检查期间用户已改选其他规则，放弃本次检查结果
  if (userSettings.imageLinkType.selected !== ImageLinkTypeEnum.GitHubPages) {
    return
  }

  if (deployed) {
    lastValidLinkType.value = name
    saveUserSettings()
    return
  }

  // 未部署 GitHub Pages：不能选择，回退后给出一键部署快捷入口
  userSettings.imageLinkType.selected = lastValidLinkType.value
  saveUserSettings()
  ElMessageBox.confirm(
    i18n.global.t('settings_page.link_rule.gh_pages_not_deployed'),
    i18n.global.t('tip'),
    {
      confirmButtonText: i18n.global.t('settings_page.image_hosting_deploy.one_click_deploy'),
      cancelButtonText: i18n.global.t('cancel'),
      type: 'warning',
    },
  )
    .then(() => deployGhPages())
    .catch(() => {})
}

// 自定义域名（CNAME）
const customDomainInput = ref(userSettings.deploy.customDomain)
const customDomainSyncing = ref(false)
const pagesDomain = userConfigInfo.owner
  ? `${userConfigInfo.owner}.github.io`
  : 'username.github.io'

const saveCustomDomain = () => {
  if (customDomainSyncing.value) {
    return
  }

  const domain = normalizeCustomDomain(customDomainInput.value)
  if (domain && !isValidCustomDomain(domain)) {
    ElMessage.warning(i18n.global.t('settings_page.image_hosting_deploy.custom_domain_invalid'))
    return
  }

  // 先持久化设置（LocalStorage + 云端 .settings 静默同步），deployGhPages 内部会先把
  // customDomain 同步为图床仓库当前分支的 CNAME 文件，再一键部署，保证 CNAME 与设置一致
  userSettings.deploy.customDomain = domain
  customDomainInput.value = domain
  persistUserSettings()

  customDomainSyncing.value = true
  deployGhPages(() => {
    customDomainSyncing.value = false
  })
}
</script>

<template>
  <div class="page-container settings-page-container">
    <el-collapse>
      <!-- 图片名称设置 -->
      <el-collapse-item :title="$t('settings_page.img_name.title')" name="1">
        <ul class="setting-list" style="margin-top: 10rem">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageName.enableHash"
              :active-text="$t('settings_page.img_name.hash_switch_name')"
              @change="persistUserSettings"
            />
            <span class="desc">{{ $t('settings_page.img_name.hash_switch_desc') }}</span>
          </li>
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageName.addPrefix.enable"
              :active-text="$t('settings_page.img_name.prefix_switch_name')"
              @change="persistUserSettings"
            />
            <span class="desc">{{ $t('settings_page.img_name.prefix_switch_desc') }}</span>
          </li>
          <li v-if="userSettings.imageName.addPrefix.enable" class="setting-item">
            <el-input
              v-model="userSettings.imageName.addPrefix.prefix"
              class="prefix-input"
              :placeholder="$t('settings_page.img_name.prefix_input_placeholder')"
              clearable
              autofocus
              @input="persistUserSettings"
            />
          </li>
        </ul>
      </el-collapse-item>

      <!-- 图片压缩设置 -->
      <el-collapse-item :title="$t('settings_page.img_compress.title')" name="3">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.compress.enable"
              :active-text="$t('settings_page.img_compress.switch_name')"
              @change="persistUserSettings"
            />
            <span class="desc">{{ $t('settings_page.img_compress.switch_desc') }}</span>
          </li>
          <li class="setting-item">
            <el-card class="settings-item-card">
              <compress-config-box
                usage-scenario="imageHosting"
                :disabled="!userSettings.compress.enable"
                @encoder=";((userSettings.compress.encoder = $event), persistUserSettings())"
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
              :active-text="$t('settings_page.img_watermark.switch_name')"
              @change="persistUserSettings"
            />
            <span class="desc">{{ $t('settings_page.img_watermark.switch_desc') }}</span>
          </li>
          <li class="setting-item">
            <el-card class="settings-item-card">
              <watermark-config-box
                :disabled="!userSettings.watermark.enable"
                @watermark-config="setWatermarkConfig"
              />
            </el-card>
          </li>
        </ul>
      </el-collapse-item>

      <!-- 图片链接规则配置 -->
      <el-collapse-item :title="$t('settings_page.link_rule.title')" name="4">
        <ul class="setting-list">
          <li class="setting-item select-row">
            <span class="label">{{ $t('settings_page.link_rule.select_title') }}：</span>
            <el-select
              v-model="userSettings.imageLinkType.selected"
              @change="onImageLinkTypeChange"
            >
              <el-option
                v-for="item in userSettings.imageLinkType.presetList"
                :key="`${item.name}-${item.id}`"
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
      <el-collapse-item :title="$t('settings_page.link_format.title')" name="5">
        <ul class="setting-list">
          <li class="setting-item has-desc">
            <el-switch
              v-model="userSettings.imageLinkFormat.enable"
              :active-text="$t('settings_page.link_format.switch_name')"
              @change="persistUserSettings"
            />
            <span class="desc">
              {{
                $t('settings_page.link_format.switch_desc', {
                  type: userSettings.imageLinkFormat.selected,
                })
              }}
            </span>
          </li>
          <li class="setting-item select-row">
            <span class="label">{{ $t('settings_page.link_format.select_title') }}：</span>
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
        <ul class="setting-list" style="margin-top: 10rem">
          <li class="setting-item">
            <div class="custom-domain-row">
              <span class="label">
                {{ $t('settings_page.image_hosting_deploy.custom_domain_label') }}
              </span>
              <el-input
                v-model="customDomainInput"
                class="input"
                :placeholder="$t('settings_page.image_hosting_deploy.custom_domain_placeholder')"
                clearable
                :disabled="customDomainSyncing"
                @keyup.enter="saveCustomDomain"
              />
              <el-button
                type="primary"
                :loading="customDomainSyncing"
                @click="saveCustomDomain"
              >
                {{ $t('settings_page.image_hosting_deploy.custom_domain_save') }}
              </el-button>
            </div>
            <div class="custom-domain-desc">
              {{ $t('settings_page.image_hosting_deploy.custom_domain_desc', { pagesDomain }) }}
            </div>
          </li>
        </ul>
      </el-collapse-item>

      <!-- 主题设置 -->
      <el-collapse-item :title="$t('settings_page.theme.title')" name="7">
        <ul class="setting-list">
          <li class="setting-item select-row">
            <span class="label">{{ $t('header.theme') }}：</span>
            <el-select v-model="globalSettings.theme" @change="persistGlobalSettings">
              <el-option :label="$t('settings_page.theme.system')" :value="ThemeModeEnum.system" />
              <el-option :label="$t('settings_page.theme.light')" :value="ThemeModeEnum.light" />
              <el-option :label="$t('settings_page.theme.dark')" :value="ThemeModeEnum.dark" />
            </el-select>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped lang="stylus">
@import "picx-settings.styl"
</style>
