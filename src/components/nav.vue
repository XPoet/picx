<template>
  <aside class="nav">
    <ul class="nav-list">
      <li class="nav-item flex-center"
          v-for="nav in navList"
          :class="{'active': nav.isActive}"
          @click="navClick(nav)"
      >{{ nav.name }}
      </li>
    </ul>
  </aside>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NavItem } from "../common/model/model"

export default defineComponent({
  name: "Nav",

  setup() {
    const router = useRouter()

    const reactiveData = reactive(
      {
        navList: [
          {
            name: 'Home',
            isActive: false,
            path: '/'
          },
          {
            name: 'Vuex',
            isActive: false,
            path: '/vuex'
          },
          {
            name: 'Axios',
            isActive: false,
            path: '/axios'
          }
        ],

        navClick(e: NavItem) {
          router.push(e.path)
        },
      }
    )


    const changeNavActive = (currentPath: string) => {
      reactiveData.navList.forEach(v => v.isActive = v.path === currentPath)
    }

    watch(() => router.currentRoute.value, (_n, _o) => {
      changeNavActive(_n.path)
    })

    onMounted(() => {
      router.isReady().then(() => {
        changeNavActive(router.currentRoute.value.path)
      })
    })

    return {
      ...toRefs(reactiveData)
    }
  }

})
</script>

<style scoped lang="stylus">

@import "../style.styl"

.nav {
  position relative
  width 100%
  height 100%
  box-sizing border-box
  background: #fff

  .nav-list {

    .nav-item {
      box-sizing border-box
      width 100%
      height 60px
      cursor pointer

      &.active {
        font-weight bold
        background $second-background-color
      }

    }

  }

}

</style>
