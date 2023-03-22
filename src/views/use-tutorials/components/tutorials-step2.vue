<template>
  <div class="tutorials-step-2">
    <h3>
      {{ $t('useCourse.step1.title') }}
      <span class="go-create-token" @click="goCreateToken"> GitHub Token</span>
    </h3>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.lpt1xl9fu.png"
      alt="Create GitHub Token"
    />
    <p>{{ $t('useCourse.step1.content1') }}</p>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.pzmcp6b80fk.png"
      alt="token-demo"
    />
    <p style="color: red">
      <em>{{ $t('useCourse.step1.content2') }}</em>
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
    color #1c81e9
    cursor pointer

    &:hover {
      color #085fb8
      border-bottom 1rem solid #085fb8
    }
  }


  img {
    width 100%
  }

  p {
    padding-top 20rem
    font-weight bold
  }
}
</style>
