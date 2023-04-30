<template>
  <el-config-provider :size="size" :z-index="3000" :locale="zhCn">
    <main-container />
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref, getCurrentInstance } from 'vue'
import { ElConfigProvider } from 'element-plus'
import axios from 'axios'
import zhCn from 'element-plus/lib/locale/lang/zh-cn'
import setThemeMode from '@/utils/set-theme-mode'
import { useStore } from '@/store'
import { throttle } from '@/utils'
import { ElementPlusSizeEnum } from '@/common/model'
import MainContainer from '@/views/main-container/main-container.vue'

const instance = getCurrentInstance()
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

// 根据用户访问ip判断出是否国外，如何是国外切换到英文模式
const changeLocaleByIp = async () => {
  try {
    // 获取用户的ip
    const response = await axios.get('https://api.ipify.org?format=json')
    const { ip } = response.data

    // 调用ipapi.co查询用户所在的国家
    const result = await axios.get(`https://ipapi.co/${ip}/country/`)
    const { data: country } = result

    // 判断用户所在的国家, 并自动切换多语言模式
    if (country === 'CN') {
      instance.proxy.$i18n.locale = 'zh-CN'
    } else {
      instance.proxy.$i18n.locale = 'en-US'
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  changeLocaleByIp()
  setThemeMode()
  elementPlusSizeHandle(window.innerWidth)
  window.addEventListener(
    'resize',
    throttle((e: any) => {
      elementPlusSizeHandle(e.target.innerWidth)
    }, 600)
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
