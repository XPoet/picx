<template>
  <div class="image-card"
       v-loading="imageObj.deleting"
       element-loading-text="删除中..."
       element-loading-background="rgba(0, 0, 0, 0.6)"
  >
    <div class="image-box">
      <img :src="imageObj.cdn_url"
           @click="imageView(imageObj)"
      >
    </div>
    <div class="info-box">
      <div class="image-info">
        <div class="filename">{{ imageObj.name }}</div>
        <div class="image-operation">
          <span class="delete">
            <el-tooltip content="删除" placement="top">
              <i class="el-icon-delete"
                 @click="deleteImage(imageObj)"
              ></i>
            </el-tooltip>
          </span>
          <span class="copy">
            <el-tooltip content="复制GitHub外链" placement="top">
              <span class="copy-url"
                    @click="copyExternalLink('GitHub', imageObj)"
              >
                GH
              </span>
            </el-tooltip>
            <el-tooltip content="复制CDN外链" placement="top">
              <span class="copy-url"
                    @click="copyExternalLink('CDN', imageObj)"
              >
                CDN
              </span>
            </el-tooltip>
            <el-tooltip content="复制Markdown格式的CDN外链" placement="top">
              <span class="copy-url"
                    @click="copyExternalLink('Markdown', imageObj)"
              >
                MD
              </span>
            </el-tooltip>
          </span>

        </div>
      </div>
    </div>
  </div>
</template>

<script>

import {mapGetters} from "vuex";
import {hashFilenameHandle} from "@/common/utils/fileHandleHelper";

export default {
  name: "ImageCard",

  data() {
    return {
      isEnableDeleted: true
    }
  },

  props: {
    imageObj: {
      type: Object,
      default: () => {
      }
    },
    isUploaded: {
      type: Boolean,
      default: false
    }
  },

  watch: {},

  computed: {
    ...mapGetters({
      userConfigInfo: 'getUserConfigInfo'
    }),
  },

  methods: {
    deleteImage(imageObj) {

      imageObj.deleting = true

      this.$axios.delete(
        `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents/${imageObj.path}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${this.userConfigInfo?.token}`
          },
          data: {
            owner: this.userConfigInfo?.owner,
            repo: this.userConfigInfo?.selectedRepos,
            path: imageObj.path,
            message: `delete from PicX`,
            sha: imageObj.sha
          }
        }
      ).then(res => {
        console.log('delete res: ', res);
        if (res && res.status === 200) {
          imageObj.deleting = false
          this.$message.success('删除成功！')
          this.$store.dispatch('UPLOADED_LIST_REMOVE', imageObj)
          this.$store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
        }
      })
    },

    copyExternalLink(type, imageObj) {
      let externalLink = ''
      let successInfo = ''
      switch (type) {
        case 'GitHub':
          externalLink = imageObj.github_url
          successInfo = type
          break
        case 'CDN':
          externalLink = imageObj.cdn_url
          successInfo = type
          break
        case 'Markdown':
          externalLink = `![${hashFilenameHandle(imageObj.name)}](${imageObj.cdn_url})`
          successInfo = 'Markdown格式的CDN'
          break
      }

      let externalLinkDom = document.querySelector('.temp-external-link')
      if (!externalLinkDom) {
        externalLinkDom = document.createElement('textarea')
        externalLinkDom.setAttribute('class', 'temp-external-link')
        externalLinkDom.style.position = 'absolute'
        externalLinkDom.style.top = '-99999px'
        externalLinkDom.style.left = '-99999px'
        document.body.appendChild(externalLinkDom)
      }

      externalLinkDom.value = externalLink
      externalLinkDom.select()
      document.execCommand('copy')
      this.$message.success(`${successInfo}外链复制成功！`)
    },

    imageView(imgObj) {
      this.$store.commit('IMAGE_VIEWER', {
        isShow: true,
        url: imgObj.cdn_url
      })
    }
  },
}
</script>

<style scoped lang="scss">

@import "src/style";

$infoBoxHeight: 56px;

.image-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-shadow: 3px 2px 3px $shadowColor;
  box-sizing: border-box;
  padding-bottom: $infoBoxHeight;

  .image-box {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

  }

  .info-box {
    width: 100%;
    height: $infoBoxHeight;
    position: absolute;
    bottom: 0;
    left: 0;

    .image-info {
      width: 100%;
      height: 100%;
      padding: 5px;
      color: #666;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .filename {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
      }

      .image-operation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 5px;

        .delete {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;

          i {
            font-size: 16px;
          }

        }

        .copy {
          .copy-url {
            padding: 1px 2px;
            border: 1px solid $fontColor_dark;
            border-radius: 5px;
            font-size: 12px;
            margin-left: 5px;
            color: $fontColor_dark;
            cursor: pointer;

            &:hover {
              transition: all 0.3s ease;
              background: $primaryColor;
              color: $fontColor_light;
              border-color: $primaryColor;
            }
          }
        }
      }
    }
  }

}
</style>
