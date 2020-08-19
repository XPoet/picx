<template>
  <div>
    <el-card class="uploaded-image"
             :body-style="{ padding: '0' }"
             v-for="item in uploadedList"
             v-loading="item.deleting"
             element-loading-text="删除中..."
             element-loading-background="rgba(0, 0, 0, 0.6)"
    >
      <img class="image" :src="item.cdn_url">
      <div class="image-info">
        <div class="filename">{{item.name}}</div>
        <div class="image-operation">
          <el-tooltip content="删除该图片" placement="top">
            <i class="el-icon-delete" @click="deleteImage(item)"></i>
          </el-tooltip>
          <el-tooltip content="复制GitHub外链" placement="top">
            <i class="el-icon-document-copy" @click="copyExternalLink('GitHub', item)"></i>
          </el-tooltip>
          <el-tooltip content="复制CDN外链" placement="top">
            <i class="el-icon-copy-document" @click="copyExternalLink('CDN', item)"></i>
          </el-tooltip>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
  import {picx_key} from "../utils/localStorage";

  export default {
    name: "UploadedList",

    data() {
      return {
        userConfigInfo: {}
      }
    },

    props: {
      uploadedList: {
        type: Array,
        default: () => []
      }
    },

    mounted() {
      this.getUserConfigInfo()
    },

    methods: {
      getUserConfigInfo() {
        let config = localStorage.getItem(picx_key)
        if (config) this.userConfigInfo = JSON.parse(config)
      },

      deleteImage(imageObj) {

        console.log('imageObj', imageObj);
        imageObj.deleting = true

        this.$axios.delete(
          `https://api.github.com/repos/${this.userConfigInfo?.username}/${this.userConfigInfo?.selectedRepos}/contents/${imageObj.path}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            },
            data: {
              owner: this.userConfigInfo?.username,
              repo: this.userConfigInfo?.selectedRepos,
              path: imageObj.path,
              message: "delete from PicX",
              sha: imageObj.sha
            }
          }
        ).then(res => {
          console.log('delete res: ', res);
          if (res.status === 200) {
            imageObj.deleting = false
            const list = this.$parent.$data.uploadedList
            const rmIndex = list.findIndex(v => v.sha === imageObj.sha)
            list.splice(rmIndex, 1)
            sessionStorage.setItem(picx_key, JSON.stringify(list))
            this.$message.success('删除成功！')
          }

        }).catch(err => {
          console.log('err: ', err);
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
      },

    }
  }
</script>

<style scoped lang="scss">

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
