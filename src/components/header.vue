<template>
  <div class="header">
    <div class="brand" @click="router.push('/')">
      <div class="logo">
        <img src="../assets/logo.png" alt="Picx" >
      </div>
      <div class="title">Picx</div>
    </div>

  </div>
</template>

<script lang="ts" setup="props">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped lang="stylus">

.header {
  width 100%
  height 100%
  background: #fff
  padding 0 20px
  box-sizing border-box

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
        width  100%
      }

    }

    .title {
      font-size 32px
      font-weight bold
    }
  }


}


</style>
