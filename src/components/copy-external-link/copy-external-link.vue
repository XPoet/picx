<template>
  <div class="copy-external-link-box">
    <el-tooltip :content="imgObj.is_transform_md ? '已转换 Markdown 格式' : '转换 Markdown 格式'" placement="top">
      <span class="btn-item transform-btn" :class="{ 'is-transform': imgObj.is_transform_md }" @click="transformMD()">
        MD
      </span>
    </el-tooltip>
    <el-tooltip content="点击复制 GitHub 外链" placement="top">
      <span class="btn-item copy-url" @click="copyExternalLink(externalLinkType.gh)"> GitHub </span>
    </el-tooltip>
    <el-tooltip content="点击复制 CDN 外链" placement="top">
      <span class="btn-item copy-url" @click="copyExternalLink(externalLinkType.cdn)"> CDN </span>
    </el-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { ExternalLinkType } from '@/common/model/externalLink.model'

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

      // eslint-disable-next-line default-case
      switch (type) {
        case ExternalLinkType.gh:
          if (props.imgObj.is_transform_md) {
            externalLink = props.imgObj.md_gh_url
            successInfo = 'Markdown 格式的 GitHub'
          } else {
            externalLink = props.imgObj.github_url
            successInfo = 'GitHub'
          }
          break

        case ExternalLinkType.cdn:
          if (props.imgObj.is_transform_md) {
            externalLink = props.imgObj.md_cdn_url
            successInfo = 'Markdown 格式的 CDN'
          } else {
            externalLink = props.imgObj.cdn_url
            successInfo = 'CDN'
          }
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

    function transformMD() {
      // eslint-disable-next-line no-param-reassign,vue/no-mutating-props
      props.imgObj.is_transform_md = !props.imgObj.is_transform_md
    }

    return {
      copyExternalLink,
      transformMD,
      externalLinkType
    }
  }
})
</script>

<style scoped lang="stylus">
@import "copy-external-link.styl"
</style>
