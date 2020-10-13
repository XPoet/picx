<template>
  <div class="page-container feedback-page-container">

    <div class="help-info-item description">
      PicX，基于 GitHub API 搭建的图床神器，图片外链自动使用 jsDelivr 进行 CDN 加速，免费、稳定、高效。
      <br>
      只需一个 GitHub 账号，免下载安装，打开网站即可使用，轻松解决图床难题。
      <br>
      建议将此网站添加至收藏夹，方便下次使用 😊
    </div>

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
      文档：
      <el-link type="primary" href="https://github.com/XPoet/picx/blob/master/README.md" target="_blank">
        https://github.com/XPoet/picx/blob/master/README.md
      </el-link>
    </div>

    <div class="help-info-item">
      贡献：欢迎各种形式的贡献，包括但不限于：美化界面、增加功能、改进代码、 修复 Bug 等。
    </div>

    <div class="help-info-item">
      反馈：使用过程中，如果遇到问题，请仔细阅读文档，或者给作者提
      <el-link type="primary" style="font-size: 16px;" href="https://github.com/XPoet/picx/issues" target="_blank">
        Issue
      </el-link>
      。
    </div>

    <div class="help-info-item">
      声明：请勿通过此网站上传违反你当地法律的图片，一切后果与此网站无关。
    </div>


    <div class="help-info-item red-text">
      如遇到数据加载缓慢或加载不出来的情况，可以借助梯子，推荐
      <el-link style="font-size: 16px;" type="primary" href="https://github.com/getlantern/lantern" target="_blank">蓝灯
      </el-link>
      。
    </div>
  </div>
</template>

<script>

export default {
  name: "Help",
}
</script>

<style scoped lang="scss">

.feedback-page-container {

  .help-info-item {
    font-size: 15.8px;
    padding: 6px;
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }


  }

  .description {
    font-weight: bold;
    line-height: 28px;
  }

  .red-text {
    color: #de1a1a;
  }
}

</style>
