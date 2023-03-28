<template>
  <aside class="nav">
    <ul class="nav-list">
      <li
        class="nav-item flex-center"
        v-for="(navItem, index) in displayNavList"
        :key="index"
        :class="{ active: navItem.isActive }"
        @click="navClick(navItem)"
        v-show="navItem.isShow"
      >
        <div class="nav-content">
          <el-icon :size="navIconSize">
            <component :is="navItem.icon"></component>
          </el-icon>
          <span class="nav-name">{{ navItem.displayName }}</span>
        </div>
      </li>
    </ul>
    <div class="nav-item quick-actions flex-center" :class="{ active: isShowQuickActions }">
      <div class="nav-content">
        <el-icon :size="navIconSize">
          <Operation />
        </el-icon>
        <span class="nav-name">{{ quickOperation().value }}</span>
      </div>
      <div class="quick-actions-box" v-show="isShowQuickActions">
        <el-switch
          v-model="isUS"
          class="mb-2"
          :active-text="quickOperation().enModel"
          @change="changeLocale"
        />
        <el-switch
          v-model="isOpenDarkMode"
          class="mb-2"
          :active-text="quickOperation().nightModel"
          @change="themeModeChange"
        />
        <el-switch
          v-model="userSettings.isCompress"
          class="mb-2"
          :active-text="quickOperation().compressPic"
          @change="persistUserSettings"
        />
        <el-switch
          v-model="userSettings.enableImageLinkFormat"
          class="mb-2"
          :active-text="quickOperation().changeMD + userSettings.imageLinkFormat.selected"
          @change="persistUserSettings"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { ElementPlusSizeEnum } from '@/common/model'

const instance = getCurrentInstance()
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

const isOpenDarkMode = ref(userSettings.themeMode === 'dark')

const navList = ref([
  {
    name: 'imgBedConfig',
    icon: 'edit',
    isActive: false,
    path: '/config',
    isShow: true
  },
  {
    name: 'uploadImg',
    icon: 'upload',
    isActive: false,
    path: '/upload',
    isShow: true
  },
  {
    // name: '图床管理',
    name: 'imageManager',
    icon: 'box',
    isActive: false,
    path: '/management',
    isShow: true
  },
  {
    // name: '我的设置',
    name: 'myConfig',
    icon: 'setting',
    isActive: false,
    path: '/settings',
    isShow: true
  },
  {
    name: 'useCourse',
    icon: 'magic-stick',
    isActive: false,
    path: '/tutorials',
    isShow: true
  },
  {
    name: 'help',
    icon: 'chat-dot-round',
    isActive: false,
    path: '/help',
    isShow: true
  }
])

const isShowQuickActions = ref<Boolean>(false)

const navClick = (e: any) => {
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
    temp.isActive = v.path === currentPath
    return temp
  })
}

const persistUserSettings = () => {
  store.dispatch('USER_SETTINGS_PERSIST')
}

const themeModeChange = () => {
  if (userSettings.themeMode === 'dark') {
    userSettings.themeMode = 'light'
  } else {
    userSettings.themeMode = 'dark'
  }
  persistUserSettings()
}

const isUS = ref<Boolean>(false)

const changeLocale = () => {
  const locale = instance?.proxy?.$i18n.locale
  if (locale === 'zh-CN') {
    instance.proxy.$i18n.locale = 'en-US'
  } else {
    instance.proxy.$i18n.locale = 'zh-CN'
  }
  // const quickOperation = instance?.proxy?.$t('quickOperation.enModel')
  // console.warn(quickOperation, 'msg')
  // console.log(returnData())
}

// 快捷操作处的国际化处理
const quickOperation = () => {
  return {
    value: instance?.proxy?.$t('quickOperation.value'),
    enModel: instance?.proxy?.$t('quickOperation.enModel'),
    nightModel: instance?.proxy?.$t('quickOperation.nightModel'),
    compressPic: instance?.proxy?.$t('quickOperation.compressPic'),
    changeMD: instance?.proxy?.$t('quickOperation.changeMD')
  }
}

// 侧边栏的国际化处理
const getDisplayName = (name: string) => {
  return instance?.proxy?.$t(`${name}.sideValue`)
}

// 计算属性，返回带有displayName的导航项列表
const displayNavList = computed(() => {
  return navList.value.map((item) => {
    return {
      ...item,
      displayName: getDisplayName(item.name)
    }
  })
})

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
