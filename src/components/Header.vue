<template>
  <header class="header">

    <div class="logo" @click="$router.push('/')">
      <i class="el-icon-picture-outline logo-icon"></i>
      PicX
    </div>

    <div class="user-info">
      <span class="username">{{ username }}</span>
      <el-dropdown trigger="click"
                   @command="handleCommand"
      >
        <span class="el-dropdown-link">
          <span class="avatar">
            <img :src="avatarUrl">
          </span>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="config">图床配置</el-dropdown-item>
          <el-dropdown-item command="management">图片管理</el-dropdown-item>
          <el-dropdown-item command="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

  </header>
</template>

<script>
  import { picx_key } from "../utils/localStorage";

  export default {
    name: "Header",

    data() {
      return {
        username: '未登录',
        avatarUrl: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      }
    },

    mounted() {
      this.getUserInfo();
    },

    methods: {
      handleCommand(command) {
        switch (command) {
          case 'config':
            this.$router.push('config')
            break;

          case 'management':
            this.$router.push('management')
            break;

          case 'logout':
            break;
        }
      },

      getUserInfo() {

        let config = localStorage.getItem(picx_key)
        if (config) {
          config = JSON.parse(config)
          this.username = config.nickname
          this.avatarUrl = config.avatar_url
        }

      },
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
        }

      }

    }

  }
</style>
