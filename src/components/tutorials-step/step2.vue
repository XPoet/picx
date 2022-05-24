<template>
  <div class="tutorials-step-2">
    <h3>
      创建一个有 repo 权限的
      <span class="go-create-token" @click="goCreateToken"> GitHub Token</span>
    </h3>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.lpt1xl9fu.png"
      alt="Create GitHub Token"
    />
    <p>然后点击 Generate token 按钮，即可生成一个token，如下图：</p>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.pzmcp6b80fk.png"
      alt="token-demo"
    />
    <p style="color: red">
      <em>新生成的 Token 只会显示一次，请妥善保存！如有遗失，重新生成即可。</em>
    </p>
  </div>
</template>

<script lang="ts" setup>
function goCreateToken() {
  window.open('https://github.com/settings/tokens/new')
}
</script>

<style lang="stylus">

.tutorials-step-2 {

  width 800rem

  .go-create-token {
    cursor pointer
    color #1c81e9

    &:hover {
      color #085fb8
      border-bottom 1rem solid #085fb8
    }
  }


  img {
    width 100%
  }

  p {
    font-weight bold
    padding-top 20rem
  }
}
</style>
