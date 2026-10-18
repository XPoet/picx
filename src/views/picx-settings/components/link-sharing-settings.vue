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
const config = computed(() => store.getUserConfigInfo)
const target = computed(() => ({ owner: config.value.owner, repo: config.value.repo, branch: config.value.branch }))
const source = useImageLinkSource()
const id = useId()
function sourceChange(event: Event) {
  if (!(event.target instanceof HTMLSelectElement))
    return
  const value = event.target.value
  event.target.value = settings.value.imageLinkType.selected
  void source.select(value)
}
function formatChange(event: Event) {
  if (event.target instanceof HTMLSelectElement)
    store.SAVE_SETTINGS_CANDIDATE({ imageLinkFormat: { ...settings.value.imageLinkFormat, selected: event.target.value } })
}
function saveRule(rule: ImageLinkRuleModel, originalName: string | undefined, done: (success: boolean) => void) {
  done(store.SAVE_IMAGE_LINK_RULE(rule, originalName))
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
        <label :for="`${id}-source`" class="settings-field-title">{{ $t('settings_page.link_rule.select_title') }}</label>
        <p>{{ $t('link_rules.source_desc') }}</p>
        <select :id="`${id}-source`" :value="settings.imageLinkType.selected" @change="sourceChange">
          <option v-for="rule in settings.imageLinkType.presetList" :key="rule.id" :value="rule.name">
            {{ rule.name }}
          </option>
        </select>
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
        <select :id="`${id}-format`" :value="settings.imageLinkFormat.selected" @change="formatChange">
          <option v-for="format in settings.imageLinkFormat.presetList" :key="format.name" :value="format.name">
            {{ format.name }}
          </option>
        </select>
        <ImageLinkPreview :target="target" :directory="config.selectedDir || '/'" :settings="settings" />
      </article>
    </div>
    <article class="settings-card settings-switch-row">
      <div><h2>{{ $t('settings_page.link_format.switch_name') }}</h2><p>{{ $t('settings_workspace.format_desc') }}</p></div><el-switch :model-value="settings.imageLinkFormat.enable" :aria-label="$t('settings_page.link_format.switch_name')" @update:model-value="store.SAVE_SETTINGS_CANDIDATE({ imageLinkFormat: { ...settings.imageLinkFormat, enable: $event === true } })" />
    </article>
    <ImageLinkRuleConfig :rules="settings.imageLinkType.presetList" @save="saveRule" @remove="store.REMOVE_IMAGE_LINK_RULE" />
  </section>
</template>
