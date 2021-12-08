<template>
  <div class="page-container feedback-page-container">
    <div class="help-info-item description">
      PicX 是一款基于 GitHub API & jsDelivr 开发的具有 CDN 加速功能的图床工具。
      <br />
      无需下载！无需安装！打开网站即用！免费！极速！稳定！
    </div>

    <div class="help-info-item">建议将本站添加至浏览器收藏夹，方便下次使用 😊</div>

    <div class="help-info-item">
      作者：
      <el-link type="primary" href="https://xpoet.cn/" target="_blank">@XPoet</el-link>
    </div>

    <div class="help-info-item">
      仓库：
      <el-link type="primary" href="https://github.com/XPoet/picx" target="_blank">
        https://github.com/XPoet/picx
      </el-link>
    </div>

    <div class="help-info-item">
      教程：
      <el-link
        type="primary"
        href="https://github.com/XPoet/picx/blob/master/README.md"
        target="_blank"
      >
        https://github.com/XPoet/picx/blob/master/README.md
      </el-link>
    </div>

    <div class="help-info-item">
      在使用过程中遇到问题，请仔细阅读文档，或者给作者提&nbsp;
      <el-link
        type="primary"
        style="font-size: 16rem"
        href="https://github.com/XPoet/picx/issues"
        target="_blank"
      >
        Issue
      </el-link>
      &nbsp;。
    </div>

    <div class="help-info-item red-text">
      图片上传缓慢或加载不出来等情况，可借助&nbsp;
      <el-link
        style="font-size: 16rem"
        type="primary"
        href="https://github.com/Alvin9999/new-pac/wiki"
        target="_blank"
        >VPN 工具
      </el-link>
      &nbsp;。
    </div>

    <div class="help-info-item">
      <strong>
        郑重声明：请勿通过本站上传违反你当地法律的图片，所造成的一切后果与本站无关。
      </strong>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'about'
})
</script>

<style scoped lang="stylus">
@import "about.styl"
</style>
