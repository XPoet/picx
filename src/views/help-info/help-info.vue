<!-- eslint-disable -->
<template>
  <div class="page-container feedback-page-container">
    <div class="help-info-item description">
      🏞️ {{ $t('help.paragraph1') }}
      <br />
      🌟 {{ $t('help.paragraph2') }}
    </div>

    <div class="help-info-item">🌍 {{ $t('help.paragraph4') }}</div>

    <div class="help-info-item">
      🤩 {{ $t('help.paragraph5') }}
      <el-link type="primary" href="https://xpoet.cn/" target="_blank">@XPoet</el-link>
    </div>

    <div class="help-info-item">
      🎁 {{ $t('help.paragraph6') }}
      <el-link type="primary" href="https://github.com/XPoet/picx" target="_blank">
        https://github.com/XPoet/picx
      </el-link>
    </div>

    <div class="help-info-item">
      📖 {{ $t('help.paragraph7') }}
      <el-link type="primary" href="https://picx-docs.xpoet.cn" target="_blank">
        https://picx-docs.xpoet.cn
      </el-link>
    </div>

    <div class="help-info-item">
      💡 {{ $t('help.paragraph8') }}
      <el-link
        type="primary"
        style="font-size: 16rem"
        href="https://github.com/XPoet/picx/issues"
        target="_blank"
      >
        Issue
      </el-link>
      &nbsp;。
    </div>

    <div class="help-info-item">
      🚥 {{ $t('help.paragraph9') }}
      <el-link
        type="primary"
        style="font-size: 16rem"
        href="https://xiyou4you.us/r/?s=24156134"
        target="_blank"
      >
        VPN
      </el-link>
      &nbsp;。
    </div>

    <div class="help-info-item red-text">
      <strong> ⚠️ {{ $t('help.paragraph10') }} </strong>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="stylus">
@import "help-info.styl"
</style>
