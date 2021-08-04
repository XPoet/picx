<template>
  <main-container />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import mainContainer from '@/components/main-container/main-container.vue'

export default defineComponent({
  name: 'App',
  components: {
    mainContainer
  }
})
</script>

<style lang="stylus">
#app {
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  box-sizing border-box
  position relative
  width 100%
  height 100%
}
</style>
