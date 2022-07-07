<template>
  <aside class="nav">
    <ul class="nav-list">
      <li
        class="nav-item flex-center"
        v-for="(navItem, index) in navList"
        :key="index"
        :class="{ active: navItem.isActive }"
        @click="navClick(navItem)"
        v-show="navItem.isShow"
      >
        <div class="nav-content">
          <el-icon :size="navIconSize">
            <component :is="navItem.icon"></component>
          </el-icon>
          <span class="nav-name">{{ navItem.name }}</span>
        </div>
      </li>
    </ul>
    <div
      class="nav-item quick-actions flex-center"
      :class="{ active: isShowQuickActions }"
    >
      <div class="nav-content">
        <el-icon :size="navIconSize">
          <Operation />
        </el-icon>
        <span class="nav-name">快捷操作</span>
      </div>
      <div class="quick-actions-box" v-show="isShowQuickActions">
        <el-switch
          v-model="isOpenDarkMode"
          class="mb-2"
          active-text="暗夜模式"
          @change="themeModeChange"
        />
        <el-switch
          v-model="userSettings.isCompress"
          class="mb-2"
          active-text="压缩图片"
          @change="persistUserSettings"
        />
        <el-switch
          v-model="userSettings.defaultMarkdown"
          class="mb-2"
          active-text="转换 Markdown"
          @change="persistUserSettings"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value

const navIconSize = computed(() => {
  switch (userSettings.elementPlusSize) {
    case 'small':
      return 22
    case 'large':
      return 30
    default:
      return 26
  }
})

const isOpenDarkMode = ref(userSettings.themeMode === 'dark')

const navList = ref([
  {
    name: '图床配置',
    icon: 'edit',
    isActive: false,
    path: '/config',
    isShow: true
  },
  {
    name: '上传图片',
    icon: 'upload',
    isActive: false,
    path: '/upload',
    isShow: true
  },
  {
    name: '图床管理',
    icon: 'box',
    isActive: false,
    path: '/management',
    isShow: true
  },
  {
    name: '我的设置',
    icon: 'setting',
    isActive: false,
    path: '/settings',
    isShow: true
  },
  {
    name: '使用教程',
    icon: 'magic-stick',
    isActive: false,
    path: '/tutorials',
    isShow: true
  },
  {
    name: '帮助反馈',
    icon: 'chat-dot-round',
    isActive: false,
    path: '/about',
    isShow: true
  }
])

const isShowQuickActions = ref<Boolean>(false)

const navClick = (e: any) => {
  const { path } = e

  if (path === '/management') {
    if (userConfigInfo.selectedRepos === '') {
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

watch(
  () => router.currentRoute.value,
  (_n) => {
    changeNavActive(_n.path)
  }
)

watch(
  () => userConfigInfo.loggingStatus,
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

  document
    .querySelector('.quick-actions .quick-actions-box')
    ?.addEventListener('click', (e) => {
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
