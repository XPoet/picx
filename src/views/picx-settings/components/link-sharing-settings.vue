<script setup lang="ts">
import { computed, ref } from 'vue'
import { isBranchExist } from '@/common/api'
import { GH_PAGES } from '@/common/constant'
import { ImageLinkTypeEnum } from '@/common/model'
import { deployGhPages } from '@/components/deploy-status-bar/deploy-status-bar.util'
import ImageLinkPreview from '@/components/image-link-preview/image-link-preview.vue'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const persistUserSettings = () => store.dispatch('USER_SETTINGS_PERSIST')
const saveUserSettings = () => store.dispatch('SET_USER_SETTINGS', { ...userSettings })
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
</script>

<template>
  <section aria-labelledby="sharing-title" class="settings-section">
    <header class="settings-section-heading">
      <h1 id="sharing-title">
        {{ $t('settings_workspace.sharing') }}
      </h1><p>{{ $t('settings_workspace.sharing_desc') }}</p>
    </header>
    <div class="settings-grid">
      <article class="settings-card">
        <h2>{{ $t('settings_page.link_rule.select_title') }}</h2>
        <el-select v-model="userSettings.imageLinkType.selected" :aria-label="$t('settings_page.link_rule.select_title')" @change="onImageLinkTypeChange">
          <el-option v-for="item in userSettings.imageLinkType.presetList" :key="item.id" :label="item.name" :value="item.name" />
        </el-select>
        <p>{{ $t('settings_workspace.current_rule') }}</p><code class="settings-preview">{{ userSettings.imageLinkType.presetList[userSettings.imageLinkType.selected]?.rule }}</code>
      </article>
      <article class="settings-card">
        <h2>{{ $t('settings_page.link_format.select_title') }}</h2>
        <el-select v-model="userSettings.imageLinkFormat.selected" :aria-label="$t('settings_page.link_format.select_title')" @change="saveUserSettings">
          <el-option v-for="item in userSettings.imageLinkFormat.presetList" :key="item.name" :label="item.name" :value="item.name" />
        </el-select>
        <ImageLinkPreview :target="{ owner: userConfigInfo.owner, repo: userConfigInfo.repo, branch: userConfigInfo.branch }" :directory="userConfigInfo.selectedDir || '/'" :settings="userSettings" />
      </article>
    </div>
    <article class="settings-card settings-switch-row">
      <div><h2>{{ $t('settings_page.link_format.switch_name') }}</h2><p>{{ $t('settings_workspace.format_desc') }}</p></div><el-switch v-model="userSettings.imageLinkFormat.enable" :aria-label="$t('settings_page.link_format.switch_name')" @change="persistUserSettings" />
    </article>
    <image-link-rule-config />
  </section>
</template>
