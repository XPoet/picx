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
      <el-tooltip content="点击复制 Staticaly CDN 外链" placement="top">
        <span
          class="btn-item copy-url flex-center"
          @click="copyLink(externalLinkType.staticaly)"
        >
          Staticaly
        </span>
      </el-tooltip>
      <el-tooltip content="点击复制 Cloudflare CDN 外链" placement="top">
        <span
          class="btn-item copy-url flex-center"
          @click="copyLink(externalLinkType.cloudflare)"
        >
          Cloudflare
        </span>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, onUpdated, watch } from 'vue'
import ExternalLinkType from '@/common/model/external-link.model'
import { store } from '@/store'
import { copyExternalLink } from '@/utils/external-link-handler'
import { UploadedImageModel } from '@/common/model/upload.model'

const props = defineProps({
  imgObj: {
    type: Object,
    default: () => {}
  }
})

const userSettings = computed(() => store.getters.getUserSettings).value

let img = ref(props.imgObj as UploadedImageModel).value
const externalLinkType = ExternalLinkType

const copyLink = (type: ExternalLinkType) => {
  copyExternalLink(img, type)
}

onUpdated(() => {
  img = props.imgObj as UploadedImageModel
})

onMounted(() => {
  img.is_transform_md = userSettings.defaultMarkdown
})

watch(
  () => userSettings.defaultMarkdown,
  (_n) => {
    img.is_transform_md = _n
  }
)
</script>

<style scoped lang="stylus">
@import "copy-external-link.styl"
</style>
