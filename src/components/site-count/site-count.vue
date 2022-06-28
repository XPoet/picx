<template>
  <span class="site-count" ref="siteCountDom" v-show="isShow">
    超过
    <span id="busuanzi_value_site_uv" class="uv" v-show="isuv"></span>
    <span id="busuanzi_value_site_pv" class="pv" v-show="!isuv"></span>
    次被使用
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

  setup(props, ctx) {
    const siteCountDom: Ref = ref<null | HTMLElement>(null)
    const isShow: Ref<boolean> = ref(false)

    const getInnerText = (dom, isuv) => {
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

    return {
      siteCountDom,
      isShow
    }
  }
})
</script>
<style lang="stylus">
.site-count {
  transition all 0.2s ease-in
}
</style>
