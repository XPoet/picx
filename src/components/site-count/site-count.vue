<script setup lang="ts">
import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'

defineProps({
  showUV: {
    type: Boolean,
    default: false,
  },
  showPV: {
    type: Boolean,
    default: false,
  },
})

const siteCountDom: Ref = ref<null | HTMLElement>(null)
const isShow: Ref<boolean> = ref(false)

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
    setTimeout(() => {
      if (getInnerText()) {
        isShow.value = true
      }
    }, 1500)
  }
})
</script>

<template>
  <div v-show="isShow" ref="siteCountDom" class="site-count border-box">
    <span v-show="showPV" class="count-item border-box">
      PV <span id="busuanzi_value_site_pv" class="pv" />
    </span>
    <span v-show="showUV" class="count-item border-box">
      UV <span id="busuanzi_value_site_uv" class="uv" />
    </span>
  </div>
</template>

<style lang="stylus">
.site-count {
  display flex
  align-items center
  justify-content flex-start
  color var(--text-color-4)
  font-size 13rem
  transition all 0.2s ease-in

  .count-item {
    margin-left 6rem
  }
}
</style>
