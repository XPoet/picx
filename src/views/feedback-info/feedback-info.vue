<script setup lang="ts">
import { computed } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { getOSName } from '@/utils'

const shortcutKey = computed(() => (getOSName() === 'win' ? 'Ctrl + D' : 'Command + D'))
</script>

<template>
  <section class="page-container feedback-page-container">
    <h1>{{ $t('footer.feedback') }}</h1>
    <p class="help-info-item description">
      <PicxIcon name="image" />
      <span>{{ $t('feedback.text_1') }}</span>
    </p>
    <p class="help-info-item">
      <PicxIcon name="globe" />
      <span>{{ $t('feedback.text_2') }} {{ $t('shortcut_key') }}：<kbd>{{ shortcutKey }}</kbd></span>
    </p>
    <div class="help-info-item">
      <PicxIcon name="user-round" />
      <span>{{ $t('author') }}：</span>
      <a href="https://xpoet.cn/" target="_blank" rel="noopener noreferrer">@XPoet</a>
    </div>
    <div class="help-info-item">
      <PicxIcon name="external-link" />
      <span>{{ $t('repo') }}：</span>
      <a href="https://github.com/XPoet/picx" target="_blank" rel="noopener noreferrer">github.com/XPoet/picx</a>
    </div>
    <div class="help-info-item">
      <PicxIcon name="book-open" />
      <span>{{ $t('document') }}：</span>
      <a href="https://picx-docs.xpoet.cn" target="_blank" rel="noopener noreferrer">picx-docs.xpoet.cn</a>
    </div>
    <a class="issue-link" href="https://github.com/XPoet/picx/issues" target="_blank" rel="noopener noreferrer">
      <PicxIcon name="external-link" />
      {{ $t('feedback.open_issue') }}
    </a>
  </section>
</template>

<style scoped lang="stylus">
@import "./feedback-info.styl"
</style>
