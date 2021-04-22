<template>
  <span class="site-count" ref="siteCountDom">
    <span id="busuanzi_value_site_uv" v-if="isuv"></span>
    <span id="busuanzi_value_site_pv" v-if="!isuv"></span>
  </span>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from 'vue'

export default defineComponent({
  name: 'site-count',

  props: {
    isuv: {
      type: Boolean,
      default: false
    }
  },

  setup() {
    const siteCountDom: Ref = ref<null | HTMLElement>(null)

    onMounted(() => {
      const script: any = document.createElement('script')
      script.async = true
      script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
      siteCountDom.value.appendChild(script)
    })

    return {
      siteCountDom
    }
  }
})
</script>
