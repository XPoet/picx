<template>
  <div class="tutorials-step-3">
    <h3>进行图床配置（绑定 GitHub Token、存储图片的仓库和目录）</h3>
    <p>1、填写 Token，自动获取该用户下的仓库</p>
    <img src="https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.4g8q5m7c8sq0.png" />
    <br />
    <p>2、在仓库的下拉列表中，选择一个作为图床的仓库</p>
    <img src="https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.746g75olruk0.png" />
    <br />
    <p>3、选择一种目录方式（目录即仓库里存放图片的文件夹）</p>
    <img src="https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.5ydmhgxjhgo0.png" />

    <div class="dir-desc-box">
      <ul>
        <li>新建目录：需手动输入一个新目录。</li>
        <li>根目录：图片将直接存储在仓库根目录下。</li>
        <li>自动目录：自动生成日期格式 YYYYMMDD 的目录。例如：20200909</li>
        <li>选择仓库目录：自动获取仓库下所有目录，选择一个即可。</li>
      </ul>
    </div>
  </div>
</template>

<style lang="stylus">

.tutorials-step-3 {

  width 800px

  img {
    width 100%
  }

  p {
    font-weight bold
    padding-top 20px
  }


  .dir-desc-box {
    display flex
    justify-content center

    ul {
      width 100%
      padding 0

      li {
        padding-top 10px
        text-align left
      }
    }
  }

}
</style>
