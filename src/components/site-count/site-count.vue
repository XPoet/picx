<template>
  <span class="site-count" ref="siteCountDom" v-show="isShow && isProd">
    <span id="busuanzi_value_site_uv" class="uv" v-show="isuv"></span>
    <span id="busuanzi_value_site_pv" class="pv" v-show="!isuv"></span>+
    {{ $t('header.usage_count') }}
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, Ref } from 'vue'

const props = defineProps({
  isuv: {
    type: Boolean,
    default: false
  }
})

const siteCountDom: Ref = ref<null | HTMLElement>(null)
const isShow: Ref<boolean> = ref(false)

const isProd = computed(() => import.meta.env.MODE === 'production')

const getInnerText = (dom: any, isuv: boolean) => {
  return dom.querySelector(`.${isuv ? 'u' : 'p'}v`).innerText
}

onMounted(() => {
  const script: any = document.createElement('script')
  script.async = true
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  siteCountDom.value.appendChild(script)

  script.onload = () => {
    const tempT = setTimeout(() => {
      if (getInnerText(siteCountDom.value, props.isuv)) {
        isShow.value = true
      }
      clearTimeout(tempT)
    }, 1500)
  }
})
</script>
<style lang="stylus">
.site-count {
  transition all 0.2s ease-in
}
</style>
