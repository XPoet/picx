<template>
  <header class="header">
    <div class="brand" @click="$router.push('/')">
      <div class="logo">
        <img :src="logoImage" alt="PicX"/>
      </div>
      <span class="name">
        PicX
      </span>
      <div class="github-stars">
        <el-tooltip effect="light"
                    content="点个Star支持一下吧 (*￣︶￣)"
                    placement="bottom"
        >
          <img alt="PicX stars"
               src="https://img.shields.io/github/stars/XPoet/picx?style=social"
               @click="goGitHubRepo"
          >
        </el-tooltip>
      </div>
    </div>

    <div class="user-info" @click="onUserInfoClick">

      <div class="username">
        {{ userConfigInfo.owner ? userConfigInfo.owner : defaultUsername }}
      </div>

      <el-dropdown trigger="click"
                   @command="handleCommand"
      >
        <span class="el-dropdown-link">
          <span class="avatar">
            <i class="el-icon-user-solid" v-if="!userConfigInfo.avatarUrl"></i>
            <img :src="userConfigInfo.avatarUrl"
                 :alt="userConfigInfo.owner"
                 v-if="userConfigInfo.avatarUrl"
            />
          </span>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-if="userConfigInfo.loggingStatus"
            command="logout"
          >退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </header>
</template>

<script>
import {mapGetters} from "vuex";

export default {
  name: "Header",

  data() {
    return {
      logoImage: require('@/assets/images/logo.png'),
      defaultUsername: '未登录',
    }
  },

  computed: {
    ...mapGetters({
      userConfigInfo: 'getUserConfigInfo'
    }),
  },

  mounted() {
  },

  methods: {
    onUserInfoClick() {
      if (!this.userConfigInfo.loggingStatus && this.$router.currentRoute.path !== '/config') {
        this.$router.push('/config')
      }
    },

    handleCommand(command) {
      switch (command) {
        case 'upload':
          this.$router.push('/')
          break;

        case 'config':
          this.$router.push('config')
          break;

        case 'management':
          this.$router.push('management')
          break;

        case 'logout':
          this.logout()
          break;
      }
    },

    logout() {
      this.$router.push('config')
      this.$store.dispatch('LOGOUT')
    },

    goGitHubRepo() {
      window.open('https://github.com/XPoet/picx');
    }
  }
}
</script>

<style scoped lang="scss">

@import "src/style";

.header {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: $headerFontColor;

  .brand {
    display: flex;
    align-items: center;
    cursor: pointer;

    .logo {
      width: 50px;
      height: 50px;
      margin-right: 10px;

      img {
        width: 100%;
      }
    }

    .name {
      font-size: 30px;
      margin-right: 10px;
    }

    .github-stars {
      margin-left: 18px;
      display: flex;
      align-items: center;
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
      color: $headerFontColor;
      border-radius: 50%;
      border: 1px solid $headerFontColor;
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
