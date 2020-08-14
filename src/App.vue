<template>
  <div id="app-container">

    <el-container class="container">
      <el-header>
        <div class="header-container">
          <Header/>
        </div>
      </el-header>
      <el-container>
        <el-main>
          <div class="main-container">
            <router-view/>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>

  import Header from "./components/Header";

  export default {
    components: {
      Header,
    }

  }
</script>

<style lang="scss">

  /*$width: 1000px;*/
  $width: 80%;

  #app-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    .el-container {
      width: 100%;
      height: 100%;
    }

    .el-header {
      padding: 0;
      display: flex;
      justify-content: center;
      background: rgb(84, 92, 100);

      .header-container {
        width: $width;
        height: 100%;
      }
    }

    .el-main {
      display: flex;
      justify-content: center;
      background: #f2f2f2;
      padding: 20px 0 0;

      .main-container {
        width: $width;
        height: 100%;
        background: #fff;
      }
    }
  }
</style>
