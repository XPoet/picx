<template>
  <header class="header">
    <div class="brand" @click="$router.push('/')">
      <div class="logo">
        <img :src="logoImage">
      </div>
      <span class="name">
        PicX
      </span>
    </div>

    <div class="user-info">

      <div class="github-stars">
        <el-tooltip effect="light"
                    content="支持开源，点个Star鼓励一下吧~"
                    placement="bottom"
        >
          <img alt="PicX stars"
               src="https://img.shields.io/github/stars/XPoet/picx?style=social"
               @click="goGitHubRepo"
          >
        </el-tooltip>
      </div>

      <span class="username">{{ userConfigInfo.name ? userConfigInfo.name : defaultUsername }}</span>
      <el-dropdown trigger="click"
                   @command="handleCommand"
      >
        <span class="el-dropdown-link">
          <span class="avatar">
            <img :src="userConfigInfo.avatarUrl ? userConfigInfo.avatarUrl : defaultAvatarUrl">
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
      defaultAvatarUrl: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    }
  },

  watch: {},

  computed: {
    ...mapGetters({
      userConfigInfo: 'getUserConfigInfo'
    }),
  },

  mounted() {
  },

  methods: {
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

.header {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  color: #f2f2f2;

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

  }

  .user-info {
    display: flex;
    align-items: center;
    cursor: pointer;

    .github-stars {
      margin-right: 28px;
      display: flex;
      align-items: center;
    }

    .username {
      font-size: 16px;
    }

    .avatar {

      margin-left: 10px;

      img {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 1px solid #ccc;
        padding: 1px;
        box-sizing: border-box;
      }

    }

  }

}
</style>
