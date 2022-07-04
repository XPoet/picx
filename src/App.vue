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
          elementPlusSize: 'small'
        })
        data.size = 'small'
      } else if (width <= 800) {
        store.dispatch('SET_USER_SETTINGS', {
          elementPlusSize: 'default'
        })
        data.size = 'default'
      } else {
        store.dispatch('SET_USER_SETTINGS', {
          elementPlusSize: 'large'
        })
        data.size = 'large'
      }
    }

    onMounted(() => {
      setTheme()
      elementPlusSizeHandle(window.innerWidth)
      window.addEventListener('resize', (e: any) => {
        elementPlusSizeHandle(e.target.innerWidth)
      })
    })

    return {
      ...toRefs(data)
    }
  }
})
</script>

<style lang="stylus">
#app {
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  box-sizing border-box
  position relative
  width 100%
  height 100%
}
</style>
