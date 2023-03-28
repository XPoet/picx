<template>
  <div class="tutorials-step-3">
    <h3>{{ $t('useCourse.step2.title') }}</h3>
    <p>{{ $t('useCourse.step2.content1') }}</p>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.4g8q5m7c8sq0.png"
    />
    <br />
    <p>{{ $t('useCourse.step2.content2') }}</p>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.746g75olruk0.png"
    />
    <br />
    <p>{{ $t('useCourse.step2.content3') }}</p>
    <p>{{ $t('useCourse.step2.content4') }}</p>
    <img
      src="https://cdn.staticaly.com/gh/XPoet/image-hosting@master/PicX/image.5ydmhgxjhgo0.png"
    />

    <div class="dir-desc-box">
      <ul>
        <li>{{ $t('useCourse.step2.li1') }}</li>
        <li>{{ $t('useCourse.step2.li2') }}</li>
        <li>{{ $t('useCourse.step2.li3') }}</li>
        <li>{{ $t('useCourse.step2.li4') }}</li>
      </ul>
    </div>
  </div>
</template>

<style lang="stylus">

.tutorials-step-3 {

  width 800rem

  img {
    width 100%
  }

  p {
    padding-top 20rem
    font-weight bold
  }


  .dir-desc-box {
    display flex
    justify-content center

    ul {
      width 100%
      padding 0

      li {
        padding-top 10rem
        text-align left
      }
    }
  }
}
</style>
