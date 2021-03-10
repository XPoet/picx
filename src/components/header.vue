<template>
  <header class="header">
    <div class="header-left">
      <div class="brand" @click="router.push('/')">
        <div class="logo">
          <img src="../assets/logo.png" alt="PicX">
        </div>
        <div class="title">PicX</div>
      </div>
      <div class="website-count" @click="goGitHubRepo">
        <el-tooltip effect="light"
                    content="维护不易，点个 Star 支持作者！"
                    placement="bottom"
        >
          <i class=""> 有
            <siteCount/>
            位小伙伴使用 PicX 图床神器</i>
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

        <el-dropdown trigger="click"
                     @command="handleCommand"
                     v-if="userConfigInfo?.avatarUrl"
        >
        <span class="el-dropdown-link">
          <span class="avatar">
            <img :src="userConfigInfo?.avatarUrl"
                 :alt="userConfigInfo?.owner"
            />
          </span>
        </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="logout"
              >
                退出登录
              </el-dropdown-item>
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
import { useStore } from 'vuex'
import siteCount from './site-count.vue'

export default defineComponent({
  name: 'Header',

  components: {
    siteCount
  },

  setup() {
    const router = useRouter()
    const store = useStore()

    const reactiveData = reactive({
      defaultUsername: '未登录',
      userConfigInfo: computed(() => store.state.userConfigInfo),
    })

    const onUserInfoClick = () => {
      if (!reactiveData.userConfigInfo.loggingStatus && router.currentRoute.value.path !== '/config') {
        router.push('/config')
      }
    }

    const logout = () => {
      router.push('/config')
      store.dispatch('LOGOUT')
    }

    const handleCommand = (command: string) => {
      switch (command) {
        case 'upload':
          router.push('/')
          break;

        case 'config':
          router.push('/config')
          break;

        case 'management':
          router.push('/management')
          break;

        case 'logout':
          logout()
          break;
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

@import "../style.styl"

.header {
  width 100%
  height 100%
  background: #fff
  padding 0 20px
  box-sizing border-box
  display flex
  justify-content space-between
  align-items center

  .header-left {
    height 100%
    display flex
    justify-content flex-start

    .brand {
      height 100%
      display flex
      justify-content flex-start
      align-items center
      cursor pointer

      .logo {
        width 46px
        height 46px
        margin-right 10px

        img {
          width 100%
        }

      }


      .title {
        font-size 36px
        font-weight bold
      }
    }


    .website-count {
      box-sizing border-box
      display flex
      align-items flex-end
      font-size 14px
      margin-left 10px
      padding-bottom 12px
      cursor pointer
    }
  }


  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;

      .username {
        font-size: 16px;
      }

      .avatar {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 38px;
        height: 38px;
        color: $default-font-color;
        border-radius: 50%;
        border: 1px solid $default-font-color;
        margin-left: 10px;
        padding: 1px;
        box-sizing: border-box;

        i {
          font-size: 28px;
        }

        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
      }

    }
  }
}

</style>
