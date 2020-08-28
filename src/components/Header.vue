<template>
  <header class="header">
    <div class="logo" @click="$router.push('/')">
      <i class="el-icon-picture-outline logo-icon"></i>
      PicX
    </div>

    <div class="user-info">
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
          <el-dropdown-item command="config">图床配置</el-dropdown-item>

          <el-dropdown-item
            command="upload"
            v-if="userConfigInfo.loggingStatus"
          >图片上传
          </el-dropdown-item>

          <el-dropdown-item
            v-if="userConfigInfo.loggingStatus"
            command="management"
          >图床管理
          </el-dropdown-item>

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
        this.$store.dispatch('LOGOUT')
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
    color: #f2f2f2;

    .logo {
      display: flex;
      align-items: center;
      font-size: 30px;
      cursor: pointer;

      i {
        font-size: 30px;
      }

      .logo-icon {
        margin-right: 6px;
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
