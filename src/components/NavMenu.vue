<template>
  <el-menu
    default-active="/"
    class="el-menu-vertical"
    @open="handleOpen"
    @close="handleClose"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
    :router="true"
  >
    <el-menu-item index="/">
      <i class="el-icon-upload"></i>
      <span>图片上传</span>
    </el-menu-item>

    <el-menu-item index="config">
      <i class="el-icon-setting"></i>
      <span>图床配置</span>
    </el-menu-item>

    <el-menu-item index="management">
      <i class="el-icon-menu"></i>
      <span>图片管理</span>
    </el-menu-item>
  </el-menu>
</template>

<script>
  export default {

    name: "NavMenu",

    methods: {
      handleOpen(key, keyPath) {
        console.log(key, keyPath);
      },
      handleClose(key, keyPath) {
        console.log(key, keyPath);
      }
    }
  }
</script>

<style scoped lang="scss">

  .el-menu-vertical {
    height: 100%;
  }


</style>
