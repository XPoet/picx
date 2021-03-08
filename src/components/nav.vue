<template>
  <aside class="nav">
    <ul class="nav-list">
      <li class="nav-item flex-center"
          v-for="nav in navList"
          :class="{'active': nav.isActive}"
          @click="navClick(nav)"
      >
        <div class="nav-content">
          <i class="nav-icon"
             :class="nav.icon"
          ></i>
          <span class="nav-name">{{ nav.name }}</span>
        </div>
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
            name: '上传',
            icon: 'el-icon-upload2',
            isActive: false,
            path: '/upload'
          },
          {
            name: '配置',
            icon: 'el-icon-edit-outline',
            isActive: false,
            path: '/config'
          },
          {
            name: '管理',
            icon: 'el-icon-setting',
            isActive: false,
            path: '/management'
          },
          {
            name: '帮助',
            icon: 'el-icon-chat-dot-round',
            isActive: false,
            path: '/help'
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
      height 68px
      cursor pointer

      &.active {
        font-weight bold
        background $second-background-color
      }

      .nav-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .nav-icon {
          font-size: 26px;
        }

        .nav-name {
          margin-top: 2px;
          font-size: 12px;
        }
      }

    }

  }

}

</style>
