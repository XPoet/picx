<script setup lang="ts">
import { computed } from 'vue'
import { getOSName } from '@/utils'

const shortcutKey = computed(() => (getOSName() === 'win' ? 'Ctrl + D' : 'Command + D'))
</script>

<template>
  <div class="page-container feedback-page-container">
    <div class="help-info-item description">
      🏞️ {{ $t('feedback.text_1') }}
    </div>

    <div class="help-info-item">
      🌍 {{ $t('feedback.text_2') }} {{ $t('shortcut_key') }}：<code>{{ shortcutKey }}</code>
    </div>

    <div class="help-info-item">
      🦁 {{ $t('author') }}：
      <el-link type="primary" href="https://xpoet.cn/" target="_blank">
        @XPoet
      </el-link>
    </div>

    <div class="help-info-item">
      🌀 {{ $t('repo') }}：
      <el-link type="primary" href="https://github.com/XPoet/picx" target="_blank">
        https://github.com/XPoet/picx
      </el-link>
    </div>

    <div class="help-info-item">
      📖 {{ $t('document') }}：
      <el-link type="primary" href="https://picx-docs.xpoet.cn" target="_blank">
        https://picx-docs.xpoet.cn
      </el-link>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "./feedback-info.styl"
</style>
