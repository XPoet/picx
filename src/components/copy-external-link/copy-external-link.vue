<template>
  <div class="copy-external-link-box">
    <div>
      <el-tooltip
        :content="img.is_transform_md ? '点击转换普通外链' : '点击转换 Markdown 格式外链'"
        placement="top"
      >
        <div
          class="markdown-icon-box flex-center"
          @click="img.is_transform_md = !img.is_transform_md"
        >
          <svg
            v-if="!img.is_transform_md"
            t="1631782798077"
            class="markdown-icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2861"
            width="26"
            height="26"
          >
            <path
              d="M92 192C42.24 192 0 232.128 0 282.016v459.968C0 791.904 42.24 832 92 832h840C981.76 832 1024 791.872 1024 741.984V282.016C1024 232.16 981.76 192 932 192z m0 64h840c16.512 0 28 12.256 28 26.016v459.968c0 13.76-11.52 26.016-28 26.016H92C75.488 768 64 755.744 64 741.984V282.016c0-13.76 11.52-25.984 28-25.984zM160 352v320h96v-212.992l96 127.008 96-127.04V672h96V352h-96l-96 128-96-128z m544 0v160h-96l144 160 144-160h-96v-160z"
              p-id="2862"
              fill="#808080"
            ></path>
          </svg>
          <svg
            v-if="img.is_transform_md"
            t="1631784688556"
            class="markdown-icon active"
            viewBox="0 0 1280 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="3242"
            width="26"
            height="26"
          >
            <path
              d="M1187.6 118.2H92.4C41.4 118.2 0 159.6 0 210.4v603c0 51 41.4 92.4 92.4 92.4h1095.4c51 0 92.4-41.4 92.2-92.2V210.4c0-50.8-41.4-92.2-92.4-92.2zM677 721.2H554v-240l-123 153.8-123-153.8v240H184.6V302.8h123l123 153.8 123-153.8h123v418.4z m270.6 6.2L763 512H886V302.8h123V512H1132z"
              p-id="3243"
              fill="#3c3c3c"
            ></path>
          </svg>
        </div>
      </el-tooltip>
    </div>
    <div class="btn-box">
      <el-tooltip content="点击复制 GitHub 外链" placement="top">
        <span
          class="btn-item copy-url github flex-center"
          @click="copyExternalLink(externalLinkType.gh)"
        >
          GitHub
        </span>
      </el-tooltip>
      <el-tooltip content="点击复制 CDN 外链" placement="top">
        <span
          class="btn-item copy-url cdn flex-center"
          @click="copyExternalLink(externalLinkType.cdn)"
        >
          CDN
        </span>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref, onUpdated } from 'vue'
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

onUpdated(() => {
  img.value = props.imgObj
})

onMounted(() => {
  img.value.is_transform_md = userConfigInfo.value.personalSetting.defaultMarkdown
})
</script>

<style scoped lang="stylus">
@import "copy-external-link.styl"
</style>
