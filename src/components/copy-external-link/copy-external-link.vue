<template>
  <div class="copy-external-link-box">
    <el-tooltip
      :content="img.is_transform_md ? '已转换 Markdown 格式' : '转换 Markdown 格式'"
      placement="top"
    >
      <span
        class="btn-item transform-btn"
        :class="{ 'is-transform': img.is_transform_md }"
        @click="transformMD()"
      >
        MD
      </span>
    </el-tooltip>
    <el-tooltip content="点击复制 GitHub 外链" placement="top">
      <span class="btn-item copy-url" @click="copyExternalLink(externalLinkType.gh)">
        GitHub
      </span>
    </el-tooltip>
    <el-tooltip content="点击复制 CDN 外链" placement="top">
      <span class="btn-item copy-url" @click="copyExternalLink(externalLinkType.cdn)">
        CDN
      </span>
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import { store } from '@/store'

// eslint-disable-next-line no-undef
const props = defineProps({
  imgObj: {
    type: Object,
    default: () => {}
  }
})

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const img = ref(props.imgObj)
const externalLinkType = ExternalLinkType

function copyExternalLink(type: ExternalLinkType) {
  let externalLink = ''
  let successInfo = ''

  const isT = img.value.is_transform_md

  // eslint-disable-next-line default-case
  switch (type) {
    case ExternalLinkType.gh:
      if (isT) {
        externalLink = img.value.md_gh_url
        successInfo = 'Markdown 格式的 GitHub'
      } else {
        externalLink = img.value.github_url
        successInfo = 'GitHub'
      }
      break

    case ExternalLinkType.cdn:
      if (isT) {
        externalLink = img.value.md_cdn_url
        successInfo = 'Markdown 格式的 CDN'
      } else {
        externalLink = img.value.cdn_url
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
  img.value.is_transform_md = !img.value.is_transform_md
}

onMounted(() => {
  img.value.is_transform_md = userConfigInfo.value.personalSetting.defaultMarkdown
})
</script>

<style scoped lang="stylus">
@import "copy-external-link.styl"
</style>
