<template>
  <div class="image-card"
       v-loading="imageObj.deleting"
       element-loading-text="删除中..."
       element-loading-background="rgba(0, 0, 0, 0.6)"
  >
    <div class="image-box">
      <img :src="imageObj.cdn_url">
    </div>
    <div class="info-box">
      <div class="image-info">
        <div class="filename">{{imageObj.name}}</div>
        <div class="image-operation">
          <el-tooltip content="删除该图片" placement="top">
            <i class="el-icon-delete" @click="deleteImage(imageObj)"
               disabled
            ></i>
          </el-tooltip>
          <el-tooltip content="复制GitHub外链" placement="top">
            <div class="copy-url"
                 @click="copyExternalLink('GitHub', imageObj)"
            >
              GitHub
            </div>
          </el-tooltip>
          <el-tooltip content="复制CDN外链" placement="top">
            <div class="copy-url"
                 @click="copyExternalLink('CDN', imageObj)"
            >
              CDN
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>

</template>

<script>

  import {mapGetters} from "vuex";

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
        switch (type) {
          case 'GitHub':
            externalLink = imageObj.github_url
            break
          case 'CDN':
            externalLink = imageObj.cdn_url
            break
        }

        const tempDom = document.createElement('textarea')
        tempDom.value = externalLink
        tempDom.style.position = 'absolute'
        tempDom.style.left = '-99999px'
        document.body.appendChild(tempDom)
        tempDom.select()
        document.execCommand('copy')
        this.$message.success(`${type}外链复制成功！`)

        // TODO: 外链复制完成后，删除 tempDom
        // ...

      },
    },
  }
</script>

<style scoped lang="scss">

  $infoBoxHeight: 56px;

  .image-card {
    position: relative;
    width: 100%;
    height: 100%;
    box-shadow: 0 0 3px #ccc;
    box-sizing: border-box;
    padding-bottom: $infoBoxHeight;

    .image-box {
      position: relative;
      width: 100%;
      height: 100%;

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
        color: #666666;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;


        .filename {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
        }

        .image-operation {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          cursor: pointer;
          margin-top: 5px;

          .copy-url {
            padding: 2px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 12px;
            margin-left: 5px;
          }

          i {
            margin-left: 10px;
          }

        }

      }
    }


  }

  .uploaded-image {

    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .image {
      width: 100%;
    }

    .image-info {
      padding: 5px;
      color: #666666;

      .filename {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
      }

      .image-operation {
        display: flex;
        justify-content: flex-end;
        margin-top: 5px;
        cursor: pointer;

        i {
          margin-left: 10px;
        }

      }

    }

  }

</style>
