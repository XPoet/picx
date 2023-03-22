<template>
  <div class="tutorials-step-1">
    <h3>
      {{ $t('useCourse.step0.contentLeft') }}
      <span class="go-create-repo" @click="goCreateRepo">
        {{ $t('useCourse.step0.contentRight') }}</span
      >
    </h3>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.j1486dtk68n.png"
      alt="Create GitHub Repository"
    />
  </div>
</template>

<script lang="ts" setup>
function goCreateRepo() {
  window.open('https://github.com/new')
}
</script>

<style lang="stylus">

.tutorials-step-1 {

  width 800rem

  .go-create-repo {
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
}
</style>
