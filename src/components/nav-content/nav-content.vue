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
          <i class="nav-icon" :class="navItem.icon"></i>
          <span class="nav-name">{{ navItem.name }}</span>
        </div>
      </li>
    </ul>
  </aside>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStore } from '@/store'
import { UserConfigInfoModel } from '@/common/model/user-config-info.model'

export default defineComponent({
  name: 'nav-content',

  setup() {
    const router = useRouter()
    const store = useStore()

    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo)
        .value,

      navList: [
        {
          name: '图床配置',
          icon: 'el-icon-edit-outline',
          isActive: false,
          path: '/config',
          isShow: true
        },
        {
          name: '上传图片',
          icon: 'el-icon-upload2',
          isActive: false,
          path: '/upload',
          isShow: true
        },
        {
          name: '图床管理',
          icon: 'el-icon-box',
          isActive: false,
          path: '/management',
          isShow: true
        },
        {
          name: '我的设置',
          icon: 'el-icon-setting',
          isActive: false,
          path: '/settings',
          isShow: true
        },
        {
          name: '使用教程',
          icon: 'el-icon-magic-stick',
          isActive: false,
          path: '/tutorials',
          isShow: true
        },
        {
          name: '帮助反馈',
          icon: 'el-icon-chat-dot-round',
          isActive: false,
          path: '/about',
          isShow: true
        }
      ],

      navClick(e: any) {
        const { path } = e

        if (path === '/management') {
          if (this.userConfigInfo.selectedRepos === '') {
            ElMessage.warning('请选择一个仓库！')
            router.push('/config')
            return
          }

          if (this.userConfigInfo.selectedDir === '') {
            ElMessage.warning('目录不能为空！')
            router.push('/config')
            return
          }
        }
        router.push(path)
      }
    })

    const changeNavActive = (currentPath: string) => {
      reactiveData.navList.forEach((v) => {
        const temp = v
        temp.isActive = v.path === currentPath
        return temp
      })
    }

    watch(
      () => router.currentRoute.value,
      (_n) => {
        changeNavActive(_n.path)
      }
    )

    watch(
      () => reactiveData.userConfigInfo.loggingStatus,
      (_n) => {
        reactiveData.navList.forEach((v: any) => {
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
    })

    return {
      ...toRefs(reactiveData)
    }
  }
})
</script>

<style scoped lang="stylus">
@import "nav-content.styl"
</style>
