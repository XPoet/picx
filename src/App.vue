<template>
  <el-config-provider :size="size" :z-index="3000" :locale="zhCn">
    <main-container />
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/lib/locale/lang/zh-cn'
import setTheme from '@/utils/set-theme-mode'
import { useStore } from '@/store'
import { throttle } from '@/utils'
import { ElementPlusSizeEnum } from '@/common/model'
import MainContainer from '@/views/main-container/main-container.vue'

const store = useStore()
const size = ref<'large' | 'default' | 'small'>('default') // large | default | small

const elementPlusSizeHandle = (width: number) => {
  if (width <= 600) {
    store?.dispatch('SET_USER_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.small
    })
    size.value = ElementPlusSizeEnum.small
  } else if (width <= 900) {
    store?.dispatch('SET_USER_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.default
    })
    size.value = ElementPlusSizeEnum.default
  } else {
    store?.dispatch('SET_USER_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.large
    })
    size.value = ElementPlusSizeEnum.large
  }
}

onMounted(() => {
  setTheme()
  elementPlusSizeHandle(window.innerWidth)
  window.addEventListener(
    'resize',
    throttle((e: any) => {
      elementPlusSizeHandle(e.target.innerWidth)
    }, 800)
  )
})
</script>

<style lang="stylus">
#app {
  position relative
  box-sizing border-box
  width 100%
  height 100%
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
}
</style>
