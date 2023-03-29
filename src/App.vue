<template>
  <el-config-provider :size="size" :z-index="zIndex" :locale="locale">
    <main-container />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/lib/locale/lang/zh-cn'
import mainContainer from '@/components/main-container/main-container.vue'
import setTheme from '@/utils/set-theme-mode'
import { useStore } from '@/store'
import { throttle } from '@/utils'
import { ElementPlusSizeEnum } from '@/common/model'

export default defineComponent({
  name: 'App',
  components: {
    ElConfigProvider,
    mainContainer
  },
  setup() {
    const store = useStore()

    const data = reactive({
      zIndex: 3000,
      size: 'small', // large | default | small
      locale: zhCn
    })

    const elementPlusSizeHandle = (width: number) => {
      if (width <= 600) {
        store.dispatch('SET_USER_SETTINGS', {
          elementPlusSize: ElementPlusSizeEnum.small
        })
        data.size = ElementPlusSizeEnum.small
      } else if (width <= 800) {
        store.dispatch('SET_USER_SETTINGS', {
          elementPlusSize: ElementPlusSizeEnum.default
        })
        data.size = ElementPlusSizeEnum.default
      } else {
        store.dispatch('SET_USER_SETTINGS', {
          elementPlusSize: ElementPlusSizeEnum.large
        })
        data.size = ElementPlusSizeEnum.large
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

    return {
      ...toRefs(data)
    }
  }
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
