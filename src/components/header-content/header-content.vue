<template>
  <header class="header">
    <div class="header-left">
      <div class="brand" @click="router.push('/')">
        <div class="logo">
          <img src="../../assets/logo.png" alt="PicX" />
        </div>
        <div class="title">PicX</div>
      </div>
      <div class="website-count" @click="goGitHubRepo">
        <el-tooltip effect="light" content="点个 Star 支持一下作者吧(*￣︶￣)" placement="bottom">
          <i class="">
            有
            <site-count :isuv="false" />
            位小伙伴使用 PicX 图床神器
          </i>
        </el-tooltip>
      </div>
    </div>

    <div class="header-right">
      <div class="user-info" @click="onUserInfoClick">
        <div class="username">
          {{ userConfigInfo.owner ? userConfigInfo.owner : defaultUsername }}
        </div>

        <div class="avatar" v-if="!userConfigInfo?.avatarUrl">
          <i class="el-icon-user-solid"></i>
        </div>

        <el-dropdown trigger="click" @command="handleCommand" v-if="userConfigInfo?.avatarUrl">
          <span class="el-dropdown-link">
            <span class="avatar">
              <img :src="userConfigInfo?.avatarUrl" :alt="userConfigInfo?.owner" />
            </span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout"> 退出登录 </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import siteCount from '@/components/site-count/site-count.vue'

export default defineComponent({
  name: 'header-content',

  components: {
    siteCount
  },

  setup() {
    const router = useRouter()
    const store = useStore()

    const reactiveData = reactive({
      defaultUsername: '未登录',
      userConfigInfo: computed(() => store.state.userConfigInfoModule.userConfigInfo)
    })

    const onUserInfoClick = () => {
      if (!reactiveData.userConfigInfo.loggingStatus && router.currentRoute.value.path !== '/config') {
        router.push('/config')
      }
    }

    const logout = () => {
      store.dispatch('LOGOUT')
      router.push('/config')
    }

    const handleCommand = (command: string) => {
      // eslint-disable-next-line default-case
      switch (command) {
        case 'upload':
          router.push('/')
          break

        case 'config':
          router.push('/config')
          break

        case 'management':
          router.push('/management')
          break

        case 'logout':
          logout()
          break
      }
    }

    const goGitHubRepo = () => {
      window.open('https://github.com/XPoet/picx')
    }

    return {
      ...toRefs(reactiveData),
      router,
      onUserInfoClick,
      handleCommand,
      goGitHubRepo
    }
  }
})
</script>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
