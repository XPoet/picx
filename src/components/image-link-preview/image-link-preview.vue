<script setup lang="ts">
import type { UserSettingsModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { imageLinkText } from '@/utils/image-link-utils'

const props = defineProps<{ target?: RepositoryIdentity | null, directory?: string, settings: UserSettingsModel, image?: { name: string, path: string }, templateOnly?: boolean }>()
const { t } = useI18n()
const preview = computed(() => {
  if (props.templateOnly) {
    const { enable, selected, presetList } = props.settings.imageLinkFormat
    return enable ? presetList.find(format => format.name === selected)?.format || 'imageLink' : 'imageLink'
  }
  if (!props.target?.owner || !props.target.repo || !props.target.branch)
    return ''
  const name = t('clipboard.example_name')
  return imageLinkText(props.image ?? { name, path: `${!props.directory || props.directory === '/' ? '' : `${props.directory}/`}${name}` }, props.target, props.settings)
})
</script>

<template>
  <div class="image-link-preview">
    <span>{{ $t('clipboard.preview') }}</span>
    <pre>{{ preview || $t('clipboard.no_preview') }}</pre>
  </div>
</template>

<style scoped lang="stylus">
.image-link-preview {
  min-width 0
  padding 12px
  color var(--picx-color-text-muted)
  background var(--picx-color-surface-muted)
  border-radius var(--picx-radius-control)
  font-size 14px
  line-height 1.6

  pre {
    margin 8px 0 0
    color var(--picx-color-text)
    font-family inherit
    font-size inherit
    white-space pre-wrap
    overflow-wrap anywhere
  }
}
</style>
