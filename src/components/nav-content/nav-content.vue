<template>
  <aside class="nav">
    <ul class="nav-list">
      <li
        class="nav-item flex-center"
        v-for="(navItem, index) in navList"
        :key="index"
        :class="{ active: navItem.isActive }"
        @click="onNavClick(navItem)"
        v-show="navItem.isShow"
      >
        <div class="nav-content">
          <el-icon :size="navIconSize">
            <component :is="navItem.icon"></component>
          </el-icon>
          <span class="nav-name">{{ $t(navItem.name) }}</span>
        </div>
      </li>
    </ul>
    <div class="nav-item quick-actions flex-center" :class="{ active: isShowQuickActions }">
      <div class="nav-content">
        <el-icon :size="navIconSize">
          <Operation />
        </el-icon>
        <span class="nav-name">{{ $t('nav.actions') }}</span>
      </div>
      <div class="quick-actions-box" v-show="isShowQuickActions">
        <el-switch
          v-model="isOpenDarkMode"
          class="mb-2"
          :active-text="$t('actions.night')"
          @change="themeModeChange"
        />
        <el-switch
          v-model="userSettings.compress.enable"
          class="mb-2"
          :active-text="$t('actions.compress')"
          @change="persistUserSettings"
        />
        <el-switch
          v-model="userSettings.imageLinkFormat.enable"
          class="mb-2"
          :active-text="$t('actions.transform') + userSettings.imageLinkFormat.selected"
          @change="persistUserSettings"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUpdated, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { ElementPlusSizeEnum, ThemeModeEnum } from '@/common/model'
import { navInfoList } from './nav-content.data'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value

const navIconSize = computed(() => {
  switch (userSettings.elementPlusSize) {
    case ElementPlusSizeEnum.small:
      return 22
    case ElementPlusSizeEnum.large:
      return 30
    default:
      return 26
  }
})

const isOpenDarkMode = ref(userSettings.theme.mode === ThemeModeEnum.dark)

const navList = ref(navInfoList)

const isShowQuickActions = ref<Boolean>(false)

const onNavClick = (e: any) => {
  const { path } = e

  if (path === '/management') {
    if (userConfigInfo.selectedRepo === '') {
      ElMessage.warning('请选择一个仓库！')
      router.push('/config')
      return
    }

    if (userConfigInfo.selectedDir === '') {
      ElMessage.warning('目录不能为空！')
      router.push('/config')
      return
    }
  }
  router.push(path)
}

const changeNavActive = (currentPath: string) => {
  navList.value.forEach((v) => {
    const temp = v
    temp.isActive = v.path === currentPath || currentPath.includes(v.path)
    return temp
  })
}

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const themeModeChange = () => {
  if (userSettings.theme.mode === ThemeModeEnum.dark) {
    userSettings.theme.mode = ThemeModeEnum.light
  } else {
    userSettings.theme.mode = ThemeModeEnum.dark
  }
  persistUserSettings()
}

watch(
  () => router.currentRoute.value,
  (_n) => {
    changeNavActive(_n.path)
  }
)

watch(
  () => userConfigInfo.logined,
  (_n) => {
    navList.value.forEach((v: any) => {
      // eslint-disable-next-line default-case
      switch (v.path) {
        case '/management':
        case '/settings':
          // eslint-disable-next-line no-param-reassign
          v.isShow = _n
      }
    })
  },
  {
    deep: true,
    immediate: true
  }
)

onUpdated(() => {
  router.isReady().then(() => {
    const curPath: string = `/${router.currentRoute.value.path.split('/')[1]}`
    changeNavActive(curPath)
  })
})

onMounted(() => {
  router.isReady().then(() => {
    changeNavActive(router.currentRoute.value.path)
  })

  document.querySelector('.quick-actions .quick-actions-box')?.addEventListener('click', (e) => {
    isShowQuickActions.value = true
    e.stopPropagation()
  })

  document.querySelector('.quick-actions')?.addEventListener('click', (e) => {
    isShowQuickActions.value = !isShowQuickActions.value
    e.stopPropagation()
  })

  document.addEventListener('click', () => {
    if (isShowQuickActions.value) {
      isShowQuickActions.value = false
    }
  })
})
</script>

<style scoped lang="stylus">
@import "nav-content.styl"
</style>
