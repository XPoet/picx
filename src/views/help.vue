<template>
  <div class="page-container feedback-page-container">

    <div class="help-info-item description">
      PicX，基于 GitHub API 开发的图床管理神器，图片外链使用 jsDelivr 进行 CDN 加速。
      <br>
      免下载、免安装，只需一个 GitHub 账号，打开 PicX 官网即可进行配置使用，轻松解决图床难题。
      <br>
      建议将本站添加至收藏夹，方便下次使用 ❤️❤️
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
      <strong>请勿通过此网站上传违反你当地法律的图片，一切后果与此网站无关。</strong>
    </div>

    <div class="help-info-item red-text">
      如遇到数据加载缓慢或加载不出来的情况，可以借助&nbsp;<el-link style="font-size: 16px;" type="primary"
                                            href="https://github.com/Alvin9999/new-pac/wiki" target="_blank">梯子
    </el-link>
      ，例如&nbsp;
      <el-link style="font-size: 16px;" type="primary" href="https://github.com/getlantern/lantern" target="_blank">蓝灯
      </el-link>
      &nbsp;等。
    </div>
    <div class="help-info-item">
      关注公众号@前端鼓励师，即可领取作者精心准备的 2021 前端大礼包，涵盖最新的 Vue / React / Angular / Node.js / Vite / 视频教程 / 学习文档 / 面试指南 / 大厂题库 等等资料，同时邀您进入前端技术交流群，一起进步。
    </div>
    <div class="help-info-item">
      <img src="https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/FE-Cheerleaders/FEC-Card.76dbi8n1bkk0.png"
           style="width: 100%"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Help'
})
</script>

<style scoped lang="stylus">
.feedback-page-container {

  .help-info-item {
    font-size: 15.8px;
    padding: 3px 6px;
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
