<template>
  <div class="page-container feedback-page-container">
    <div class="help-info-item description">
      PicX，基于 GitHub API 开发的图床管理神器，图片外链使用 jsDelivr 进行全球 CDN
      加速。免费、稳定、高效。
      <br />
      免下载、免安装，只需一个 GitHub 账号，打开网站即可进行配置使用，轻松解决图床难题。
      <br />
      建议将此网站添加至收藏夹，方便下次使用 😊
      <br />
      PS: 这是Hajeekn自用,不确保稳定性,至少自我能访问即可
    </div>

    <div class="help-info-item">
      本项目基于XPoet大佬的：
      <el-link type="primary" href="https://github.com/XPoet/picx" target="_blank">
        PicX
      </el-link>
      项目构建
    </div>

    <div class="help-info-item red-text">
      如遇到数据加载缓慢或加载不出来的情况，可以借助扶墙工具，推荐&nbsp;
      <el-link
        style="font-size: 16px"
        type="primary"
        href="https://github.com/getlantern/lantern"
        target="_blank"
        >蓝灯
      </el-link>
      &nbsp;。
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'About'
})
</script>

<style scoped lang="stylus">
@import "index.styl"
</style>
