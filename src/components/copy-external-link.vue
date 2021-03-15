<template>
  <div class="copy-external-link-box">
    <el-tooltip content="复制 GitHub 外链" placement="top">
      <span class="copy-url"
            @click="copyExternalLink(externalLinkType.gh)"
      >
        gh
      </span>
    </el-tooltip>
    <el-tooltip content="复制 MD 格式的 GitHub 外链" placement="top">
      <span class="copy-url"
            @click="copyExternalLink(externalLinkType.md_gh)"
      >
        md_gh
      </span>
    </el-tooltip>
    <el-tooltip content="复制 CDN 外链" placement="top">
      <span class="copy-url"
            @click="copyExternalLink(externalLinkType.cdn)"
      >
        cdn
      </span>
    </el-tooltip>
    <el-tooltip content="复制 MD 格式的 CDN 外链" placement="top">
      <span class="copy-url"
            @click="copyExternalLink(externalLinkType.md_cdn)"
      >
        md_cdn
      </span>
    </el-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { ExternalLinkType } from '../common/model/external-link.model'

export default defineComponent({
  name: 'copy-external-link',

  props: {
    imgObj: {
      type: Object,
      default: () => ({})
    }
  },

  setup(props) {

    const externalLinkType = ExternalLinkType

    function copyExternalLink(type: ExternalLinkType) {

      let externalLink = ''
      let successInfo = ''

      switch (type) {
        case ExternalLinkType.gh:
          externalLink = props.imgObj.github_url
          successInfo = 'GitHub'
          break

        case ExternalLinkType.md_gh:
          externalLink = props.imgObj.md_gh_url
          successInfo = 'Markdown 格式的 GitHub'
          break

        case ExternalLinkType.cdn:
          externalLink = props.imgObj.cdn_url
          successInfo = 'CDN'
          break

        case ExternalLinkType.md_cdn:
          externalLink = props.imgObj.md_cdn_url
          successInfo = 'Markdown 格式的 CDN'
          break
      }

      let externalLinkDom: any = document.querySelector('.temp-external-link')
      if (!externalLinkDom) {
        externalLinkDom = document.createElement('textarea')
        externalLinkDom.setAttribute('class', 'temp-external-link')
        externalLinkDom.style.position = 'absolute'
        externalLinkDom.style.top = '-99999px'
        externalLinkDom.style.left = '-99999px'
        document.body.appendChild(externalLinkDom)
      }

      externalLinkDom.value = externalLink
      externalLinkDom.select()
      document.execCommand('copy')
      ElMessage.success(`${successInfo} 外链复制成功！`)
    }

    return {
      copyExternalLink,
      externalLinkType,
    }

  }
})
</script>

<style scoped lang="stylus">

@import "../style.styl"

.copy-external-link-box {

  .copy-url {
    box-sizing border-box
    padding: 0 2px
    border: 1px solid $default-font-color
    border-radius: 5px
    font-size: 12px
    margin-right: 6px
    color: $default-font-color
    cursor: pointer
    transition: all 0.3s ease

    &:last-child {
      margin-left: 0
    }

    &:hover {
      background: $default-font-color
      color: $background-color
      border-color: $default-font-color
    }
  }
}

</style>
