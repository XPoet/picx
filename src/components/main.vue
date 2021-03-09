<template>
  <main class="main-container">

    <div class="top">
      <Header/>
    </div>

    <div class="bottom">

      <div class="left">
        <Nav/>
      </div>

      <div class="right">
        <div class="content">
          <router-view/>
        </div>
      </div>
    </div>

  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Header from '@/components/header.vue'
import Nav from '@/components/nav.vue'

export default defineComponent({
  name: 'App',
  components: {
    Header,
    Nav
  }
})
</script>

<style scoped lang="stylus">

@import "../style.styl"

$top-height = 60px
$left-side-width = 80px

.main-container {
  position absolute
  box-sizing border-box
  width 100%
  height 100%
  background $second-background-color
  padding-top $top-height


  .top {
    position absolute
    top 0
    left 0
    box-sizing border-box
    width 100%
    height $top-height
  }


  .bottom {
    position relative
    box-sizing border-box
    width 100%
    height 100%
    display flex
    justify-content space-between
    padding-top $component-interval


    .left {
      position relative
      width $left-side-width
      height 100%
      box-sizing border-box
    }


    .right {
      position relative
      width 100%
      height 100%
      box-sizing border-box
      padding 0 $component-interval $component-interval $component-interval

      .content {
        position relative
        box-sizing border-box
        width 100%
        height 100%
        background $background-color
        border-radius 5px
        overflow-y auto
      }
    }
  }
}


.page-links {
  a {
    font-weight: bold;
    margin: 0 20px;
  }
}


</style>
