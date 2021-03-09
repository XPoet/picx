<template>
  <header class="header">
    <div class="brand" @click="router.push('/')">
      <div class="logo">
        <img src="../assets/logo.png" alt="Picx">
      </div>
      <div class="title">Picx</div>
    </div>

    <div class="user-info" @click="onUserInfoClick">

      <div class="username">
        {{ userConfigInfo.owner ? userConfigInfo.owner : defaultUsername }}
      </div>

      <div class="avatar" v-if="!userConfigInfo?.avatarUrl">
        <i class="el-icon-user-solid"></i>
      </div>

      <el-dropdown trigger="click"
                   @command="handleCommand"
                   v-if="userConfigInfo?.loggingStatus"
      >
        <span class="el-dropdown-link">
          <span class="avatar">
            <img :src="userConfigInfo.avatarUrl"
                 :alt="userConfigInfo.owner"
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
  </header>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, toRefs} from 'vue'
import {useRouter} from 'vue-router'
import {useStore} from 'vuex'

export default defineComponent({
  name: 'Header',

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

    return {
      ...toRefs(reactiveData),
      router,
      onUserInfoClick,
      handleCommand,
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
      font-size 32px
      font-weight bold
    }
  }


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
      color: $header-font-color;
      border-radius: 50%;
      border: 1px solid $header-font-color;
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

</style>
