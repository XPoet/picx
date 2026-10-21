<script setup lang="ts">
import type { ImageLinkRuleModel } from '@/common/model'
import { computed, useId } from 'vue'
import ImageLinkPreview from '@/components/image-link-preview/image-link-preview.vue'
import ImageLinkRuleConfig from '@/components/image-link-rule-config/image-link-rule-config.vue'
import { useImageLinkSource } from '@/composables/use-image-link-source'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'

const store = usePicxStore(pinia)
const settings = computed(() => store.getUserSettings)
const previewSettings = computed(() => ({
  ...settings.value,
  imageLinkFormat: { ...settings.value.imageLinkFormat, enable: true },
}))
const config = computed(() => store.getUserConfigInfo)
const target = computed(() => ({ owner: config.value.owner, repo: config.value.repo, branch: config.value.branch }))
const source = useImageLinkSource()
const id = useId()
function sourceChange(value: string) {
  void source.select(value)
}
function formatChange(value: string) {
  store.SAVE_SETTINGS_CANDIDATE({ imageLinkFormat: { ...settings.value.imageLinkFormat, selected: value } })
}
function saveRule(rule: ImageLinkRuleModel, originalName: string | undefined, done: (success: boolean) => void) {
  done(store.SAVE_IMAGE_LINK_RULE(rule, originalName))
}
</script>

<template>
  <section class="settings-section">
    <header class="settings-section-heading">
      <h1 id="sharing-title">
        {{ $t('settings_workspace.sharing') }}
      </h1><p>{{ $t('settings_workspace.sharing_desc') }}</p>
    </header>
    <div class="settings-grid">
      <article class="settings-card">
        <label :for="`${id}-source`" class="settings-field-title">{{ $t('settings_page.link_rule.select_title') }}</label>
        <p>{{ $t('link_rules.source_desc') }}</p>
        <el-select :id="`${id}-source`" :model-value="settings.imageLinkType.selected" @change="sourceChange">
          <el-option v-for="rule in settings.imageLinkType.presetList" :key="rule.id" :value="rule.name" :label="rule.name" />
        </el-select>
        <p v-if="source.checking.value" role="status">
          {{ $t('deployment.checking') }}
        </p>
        <p v-if="source.error.value" role="alert" class="settings-error">
          {{ $t(source.error.value) }}
        </p>
        <p>{{ $t('settings_workspace.current_rule') }}</p><code class="settings-preview">{{ settings.imageLinkType.presetList[settings.imageLinkType.selected]?.rule }}</code>
      </article>
      <article class="settings-card">
        <label :for="`${id}-format`" class="settings-field-title">{{ $t('settings_page.link_format.select_title') }}</label>
        <p>{{ $t('link_rules.format_desc') }}</p>
        <el-select :id="`${id}-format`" :model-value="settings.imageLinkFormat.selected" @change="formatChange">
          <el-option v-for="format in settings.imageLinkFormat.presetList" :key="format.name" :value="format.name" :label="format.name" />
        </el-select>
        <ImageLinkPreview :target="target" :directory="config.selectedDir || '/'" :settings="previewSettings" />
      </article>
    </div>
    <article class="settings-card settings-switch-row">
      <div><h2><label :for="`${id}-format-enabled`">{{ $t('settings_page.link_format.switch_name') }}</label></h2><p>{{ $t('settings_workspace.format_desc') }}</p></div><el-switch :id="`${id}-format-enabled`" :model-value="settings.imageLinkFormat.enable" @update:model-value="store.SAVE_SETTINGS_CANDIDATE({ imageLinkFormat: { ...settings.imageLinkFormat, enable: $event === true } })" />
    </article>
    <ImageLinkRuleConfig :rules="settings.imageLinkType.presetList" @save="saveRule" @remove="store.REMOVE_IMAGE_LINK_RULE" />
  </section>
</template>
