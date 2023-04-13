<template>
  <div class="page-container feedback-page-container">
    <div class="help-info-item description">
      🏞️ PicX 是一款基于 GitHub API
      开发的图床工具，提供图片上传托管、生成图片链接和常用图片工具箱服务。
    </div>

    <div class="help-info-item">
      🌍 建议将本站添加到浏览器收藏夹，方便下次使用。快捷键：<code>{{ shortcutKey }}</code>
    </div>

    <div class="help-info-item">
      🦁 作者：
      <el-link type="primary" href="https://xpoet.cn/" target="_blank">@XPoet</el-link>
    </div>

    <div class="help-info-item">
      🌀 仓库：
      <el-link type="primary" href="https://github.com/XPoet/picx" target="_blank">
        https://github.com/XPoet/picx
      </el-link>
    </div>

    <div class="help-info-item">
      📖 文档：
      <el-link type="primary" href="https://picx-docs.xpoet.cn" target="_blank">
        https://picx-docs.xpoet.cn
      </el-link>
    </div>

    <div class="help-info-item">
      💡 在使用过程中如遇到问题，请仔细阅读文档，或者给作者提&nbsp;
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

    <div class="help-info-item" style="margin-bottom: 2rem">
      🎁 如果 PicX 对你有帮助，欢迎赞赏作者，支持开源。
    </div>

    <div class="help-info-item img">
      <el-image
        style="width: 300rem"
        src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/common/appreciation.webp"
      />
    </div>

    <div class="help-info-item red-text">
      <strong>
        ⚠️ 郑重声明：请勿通过本站上传违反你当地法律的图片，所造成的一切后果与本站无关。
      </strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getOSName } from '@/utils'

const shortcutKey = computed(() => (getOSName() === 'win' ? 'Ctrl + D' : 'Command + D'))
</script>

<style scoped lang="stylus">
@import "./feedback-info.styl"
</style>
