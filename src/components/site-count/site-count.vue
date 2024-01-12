<template>
  <div class="site-count" ref="siteCountDom" v-show="isShow">
    <span class="count-item" v-show="showPV"> PV <span id="busuanzi_value_site_pv"></span> </span>
    <span class="count-item" v-show="showUV"> UV <span id="busuanzi_value_site_uv"></span> </span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue'

defineProps({
  showUV: {
    type: Boolean,
    default: false
  },
  showPV: {
    type: Boolean,
    default: false
  }
})

const siteCountDom: Ref = ref<null | HTMLElement>(null)
const isShow: Ref<boolean> = ref(true)

// const isProd = computed(() => import.meta.env.MODE === 'production')

const getInnerText = () => {
  return siteCountDom.value?.querySelector('.pv')?.innerText
}

onMounted(() => {
  const script: any = document.createElement('script')
  script.async = true
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  siteCountDom.value.appendChild(script)

  script.onload = () => {
    const tempT = setTimeout(() => {
      if (getInnerText()) {
        isShow.value = true
      }
      clearTimeout(tempT)
    }, 1500)
  }
})
</script>
<style lang="stylus">
.site-count {
  margin-top 4rem
  color var(--text-color-4)
  font-size 13rem
  transition all 0.2s ease-in

  .count-item {
    margin-right 4rem

    &:last-child {
      margin-right 0
    }
  }
}
</style>
