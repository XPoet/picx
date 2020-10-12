<template>
  <div class="left-side-content">
    <ul class="menu-list">
      <li class="menu-item"
          v-for="item in menuObjList"
          :class="{'active': item.isActive}"
          @click="onClickMenu(item)"
          v-show="item.path !== '/management' || (userConfigInfo.loggingStatus)"
      >
        <div class="menu-content">
          <i class="menu-icon"
             :class="item.icon"
          ></i>
          <span class="menu-title">{{ item.title }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import {mapGetters} from "vuex";

export default {
  name: "LeftSide",

  data() {
    return {
      menuObjList: [
        {
          title: '配置',
          icon: 'el-icon-edit',
          isActive: true,
          path: '/config'
        },
        {
          title: '上传',
          icon: 'el-icon-upload',
          isActive: false,
          path: '/upload'
        },
        {
          title: '管理',
          icon: 'el-icon-setting',
          isActive: false,
          path: '/management'
        },
      ]
    }
  },

  mounted() {
    this.initMenuActive()
  },

  watch: {
    $route(e) {
      this.menuObjList.forEach(v => v.isActive = v.path === e.path)
    }
  },

  computed: {
    ...mapGetters({
      userConfigInfo: 'getUserConfigInfo',
    }),
  },

  methods: {
    onClickMenu(event) {

      const path = event.path

      if (path === '/management') {

        if (!this.userConfigInfo.selectedRepos) {
          this.$message.warning('请选择一个仓库！')
          return
        }

        if (!this.userConfigInfo.selectedDir) {
          this.$message.warning('请选择一个目录！')
          return
        }
      }
      this.$router.push(path)
    },

    initMenuActive() {
      this.menuObjList.forEach(v => v.isActive = v.path === this.$router.currentRoute.path)
    }
  }
}
</script>

<style scoped lang="scss">

@import "src/style";

.left-side-content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .menu-list {

    .menu-item {
      width: 100%;
      height: $leftSideWidth;
      box-sizing: border-box;
      cursor: pointer;
      color: #585858;
      margin-top: 20px;
      display: flex;
      justify-content: center;
      align-items: center;

      .menu-content {

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .menu-icon {
          font-size: 26px;
        }

        .menu-title {
          margin-top: 2px;
          font-size: 12.8px;
        }
      }


      &.active {
        background: $backgroundColor;
        color: #555;
        position: relative;
        font-weight: bold;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 4px;
          background: $primaryColor;
        }
      }

    }

  }

}

</style>
