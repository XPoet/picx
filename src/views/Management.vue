<template>
  <div class="picx-container management-page-container">
    <div class="content-container">
      <div class="top">
        <div class="status-info-bar">
          <div class="repos-dir">
            当前仓库：<span class="selected">{{ userConfigInfo.selectedRepos }}</span>
            当前目录：<span class="selected">{{ userConfigInfo.selectedDir ? userConfigInfo.selectedDir : '/'}}</span>
          </div>
          <div class="change-dir">
            切换目录：
            <el-select v-model="userConfigInfo.selectedDir"
                       placeholder="请选择"
                       size="small"
                       @change="dirChange"
            >
              <el-option
                v-for="item in dirImageList"
                :label="item.dir"
                :value="item.dir"
              >
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <div class="bottom">
        <ul class="image-list">
          <li class="image-item"
              v-for="image in currentDirImageList"
              :style="{
                width: '220px',
                height: '230px',
              }"
          >
            <ImageCard :image-obj="image"/>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script>
  import generateExternalLink from "../common/utils/generateExternalLink";
  import {filenameHandle, isImage} from "../common/utils/filenameHandle";
  import ImageCard from "../components/ImageCard";
  import {mapGetters} from "vuex";

  export default {
    name: "Management",

    components: {
      ImageCard
    },

    data() {
      return {
        currentDirImageList: [],
      }
    },

    watch: {
      loggingStatus(loggingStatus) {
        // 监听退出登录的行为，跳转至配置页
        !loggingStatus && this.$router.push('config')
      },


      dirImageList: {
        handler: function (e) {
          this.currentDirImageList = e.find(v => v.dir === this.userConfigInfo.selectedDir).imageList
        },
        deep: true
      }

    },

    computed: {
      ...mapGetters({
        loggingStatus: 'getUserLoggingStatus',
        dirImageList: 'getDirImageList',
        userConfigInfo: 'getUserConfigInfo',
      }),
    },

    mounted() {
      this.initDirImageList()
    },

    methods: {

      initDirImageList() {

        const selectedDir = this.userConfigInfo.selectedDir

        if (this.dirImageList.length > 0) {

          const selectedDirObj = this.dirImageList.find(v => v.dir === selectedDir)

          if (selectedDirObj) {

            if (selectedDirObj.imageList.length > 0) {
              this.currentDirImageList = selectedDirObj.imageList
            } else {
              // 请求该目录内容
              this.getDirContent(selectedDirObj)
            }

          } else {
            // 往 store 的 dirImageList 添加 dirObj，同时请求该目录内容，显示出来
            const dirObj = {dir: selectedDir, imageList: []}
            this.getDirContent(dirObj)
          }

        } else {
          this.getReposContent()
        }
      },

      getReposContent() {
        if (this.userConfigInfo) {
          this.$axios.get(
            `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents`,
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `token ${this.userConfigInfo.token}`
              }
            }
          ).then(res => {
            console.log('res: ', res);
            if (res && res.status === 200 && res.data.length > 0) {

              this.$store.dispatch('DIR_IMAGE_LIST_ADD_DIR', {dir: '/', imageList: []})

              for (const item of res.data) {
                if (item.type === 'dir') {

                  this.$store.dispatch('DIR_IMAGE_LIST_ADD_DIR', {dir: item.name, imageList: []})

                } else if (item.type === 'file' && isImage(filenameHandle(item.name).suffix)) {

                  this.$store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', this.getImageObject(item))
                }
              }

            }
          })
        }
      },

      // 获取指定目录的内容
      getDirContent(dirObj) {

        this.$axios.get(
          `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents/${this.userConfigInfo?.selectedDir}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            }
          }
        )
          .then(res => {
            if (res && res.status === 200 && res.data.length > 0) {
              const tempImageList = []
              for (const item of res.data) {
                if (item.type === 'file' && isImage(filenameHandle(item.name).suffix)) {
                  tempImageList.push(this.getImageObject(item))
                }
              }
              dirObj.imageList = tempImageList
              this.currentDirImageList = tempImageList
              this.$store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE_LIST', dirObj)
            }
          })

      },

      getImageObject(item) {
        if (isImage(filenameHandle(item.name).suffix)) {
          return {
            dir: this.userConfigInfo.selectedDir,
            name: item.name,
            path: item.path,
            sha: item.sha,
            html_url: item.html_url,
            github_url: item['download_url'],
            cdn_url: generateExternalLink('cdn', item, this.userConfigInfo),
            deleting: false,
          }
        }
      },

      dirChange(e) {
        const selectedDir = this.dirImageList.find(v => v.dir === e)
        if (selectedDir.imageList.length > 0) {
          this.currentDirImageList = selectedDir.imageList
        } else {
          this.getDirContent(selectedDir)
        }
      }

    },
  }
</script>

<style scoped lang="scss">

  $infoBarHeight: 50px;

  .management-page-container {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 20px;

    .content-container {
      position: relative;
      width: 100%;
      height: 100%;
      padding-top: $infoBarHeight;
      box-sizing: border-box;

      .top {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: $infoBarHeight;
        box-sizing: border-box;

        .status-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #555;
          font-size: 14px;

          .repos-dir {

            .selected {
              padding: 2px 4px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }

          }


        }

      }

      .bottom {
        width: 100%;
        height: 100%;
        box-sizing: border-box;

        .image-list {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          list-style: none;
          border: 1px solid #ccc;
          overflow-y: auto;

          li.image-item {
            float: left;
            box-sizing: border-box;
            padding: 10px;

            &:last-child {
              margin-right: 0;

            }
          }
        }

      }
    }
  }

</style>
