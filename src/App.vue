<template>
  <div id="layout-container">

    <div class="app-container">
      <div class="app-header-container">
        <Header/>
      </div>
      <div class="app-content-container">
        <div class="left-side-content">
          <LeftSide/>
        </div>
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
import LeftSide from "./components/LeftSide";
import ImageViewer from "./components/ImageViewer";

export default {
  components: {
    Header,
    LeftSide,
    ImageViewer,
  }

}
</script>

<style lang="scss">

@import "src/style";

#layout-container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  .app-container {
    position: relative;
    width: 100%;
    height: 100%;
    padding-top: $headerHeight;
    box-sizing: border-box;

    .app-header-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: $headerHeight;
      background: $primaryColor;
      padding: 0 20px;
      box-sizing: border-box;
    }

    .app-content-container {
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background: $backgroundColor;
      display: flex;
      justify-content: space-between;
      padding-left: $leftSideWidth;

      .left-side-content {
        position: absolute;
        top: 0;
        left: 0;
        width: $leftSideWidth;
        height: 100%;
        background: #fff;
      }

      .main-content {
        position: relative;
        height: 100%;
        width: 100%;
        padding: 20px 15% 0 15%;
        box-sizing: border-box;

        @media (max-width: $mediaMaxWidth) {
          padding: 20px 20px 0 20px;
        }
      }
    }
  }

}
</style>
