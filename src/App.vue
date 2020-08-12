<template>
  <div id="app-container">
    <el-container class="container">
      <el-aside width="220px">
        <NavMenu/>
      </el-aside>
      <el-container class="content-container">
        <el-main>
          <router-view/>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>

  import NavMenu from "./components/NavMenu";

  export default {

    components: {
      NavMenu
    }

  }
</script>

<style lang="scss">
  #app-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    .container {
      width: 100%;
      height: 100%;
    }

    .el-aside {
      background-color: #becfe2;
      color: #333;
    }

    .content-container {

      background: #f2f2f2;
      padding: 20px;

      .el-main {
        width: 100%;
        height: 100%;
        background-color: #fff;
      }
    }


  }
</style>
