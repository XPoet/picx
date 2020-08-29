<template>
  <div id="layout-container">

    <div class="app-container">
      <div class="app-header-container">
        <div class="header-content">
          <Header/>
        </div>
      </div>
      <div class="app-main-container">
        <div class="main-content">
          <router-view/>
        </div>
      </div>
    </div>

    <ImageViewer></ImageViewer>

  </div>
</template>

<script>

  import Header from "./components/Header";
  import ImageViewer from "./components/ImageViewer";

  export default {
    components: {
      Header,
      ImageViewer,
    }

  }
</script>

<style lang="scss">
  $headerHeight: 60px;
  $maxWidth: 1200px;
  $mediaMaxWidth: 1400px;

  #layout-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    transition: all .3s ease;


    .app-container {
      position: relative;
      width: 100%;
      height: 100%;
      padding-top: $headerHeight + 20px;
      box-sizing: border-box;
      background: #f2f2f2;

      .app-header-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: $headerHeight;
        display: flex;
        justify-content: center;
        background: rgb(84, 92, 100);

        .header-content {
          position: relative;
          width: $maxWidth;
          @media (max-width: $mediaMaxWidth) {
            width: 88%;
          }
          height: 100%;
        }
      }

      .app-main-container {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        box-sizing: border-box;

        .main-content {
          position: relative;
          width: $maxWidth;
          @media (max-width: $mediaMaxWidth) {
            width: 88%;
          }
          height: 100%;
        }
      }
    }

  }
</style>
