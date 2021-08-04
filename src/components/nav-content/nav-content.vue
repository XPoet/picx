<template>
  <aside class="nav">
    <ul class="nav-list">
      <li
        class="nav-item flex-center"
        v-for="(navItem, index) in navList"
        :key="index"
        :class="{ active: navItem.isActive }"
        @click="navClick(navItem)"
        v-show="navItem.path !== '/management' || userConfigInfo.loggingStatus"
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
import { useStore } from '@/store'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: 'nav-content',

  setup() {
    const router = useRouter()
    const store = useStore()

    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,

      navList: [
        {
          name: '图床配置',
          icon: 'el-icon-edit-outline',
          isActive: false,
          path: '/config'
        },
        {
          name: '上传图片',
          icon: 'el-icon-upload2',
          isActive: false,
          path: '/upload'
        },
        {
          name: '图床管理',
          icon: 'el-icon-box',
          isActive: false,
          path: '/management'
        },
        {
          name: '使用教程',
          icon: 'el-icon-magic-stick',
          isActive: false,
          path: '/tutorials'
        },
        {
          name: '帮助反馈',
          icon: 'el-icon-chat-dot-round',
          isActive: false,
          path: '/about'
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
