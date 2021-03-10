<template>
  <div class="page-container management-page-container">
    <div class="content-container">

      <div class="top">
        <div class="status-info-bar">
          <div class="repos-dir">
            <span class="info-item">
              当前仓库：<el-tag>{{ userConfigInfo.selectedRepos }}</el-tag>
            </span>
            <span class="info-item">
              当前目录：<el-tag>{{ userConfigInfo.selectedDir }}</el-tag>
            </span>
          </div>
          <div class="change-dir">
            切换目录：
            <el-select v-model="userConfigInfo.selectedDir"
                       placeholder="请选择"
                       size="small"
                       @change="dirChange"
            >
              <el-option
                v-for="item in userConfigInfo.dirList"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <div class="bottom"
           v-loading="loadingImageList"
           element-loading-text="加载中..."
           element-loading-background="rgba(0, 0, 0, 0.6)"
      >
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

<script lang="ts">
import {defineComponent, reactive, toRefs, watch, computed, onMounted} from 'vue'
import generateExternalLink from '../common/utils/generateExternalLink'
import {filenameHandle, isImage} from '../common/utils/fileHandleHelper'
import ImageCard from '../components/image-card.vue'
import {useStore} from "vuex";
import {useRouter} from "vue-router";
import getUuid from '../common/utils/getUuid'
import axios from '../common/utils/axios/index'
import {UserConfigInfoModel} from "../common/model/model";


export default defineComponent({
  name: 'Management',

  components: {
    ImageCard
  },

  setup() {

    const store = useStore()
    const router = useRouter()

    const reactiveData = reactive({

      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,
      loggingStatus: computed(() => store.getters.getUserLoggingStatus).value,
      dirImageList: computed(() => store.getters.getDirImageList).value,

      currentDirImageList: [],
      loadingImageList: false,


      initDirImageList() {

        if (!this.dirImageList.length) {
          this.getReposContent()
          return
        }

        const selectedDir = this.userConfigInfo.selectedDir
        const targetDirObj = this.dirImageList.find((v: any) => v.dir === selectedDir)

        if (!targetDirObj) {
          if (this.isHasDir(selectedDir)) {
            this.getDirContent(selectedDir)
          }
          return
        }

        if (targetDirObj.imageList.length > 0) {
          this.currentDirImageList = targetDirObj.imageList
        } else {
          // 请求该目录内容
          this.getDirContent(selectedDir)
        }

      },

      getReposContent() {
        axios.get(
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

            store.dispatch('DIR_IMAGE_LIST_ADD_DIR', '/')

            for (const item of res.data) {
              if (item.type === 'dir') {

                store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.name)

              } else if (item.type === 'file' && isImage(filenameHandle(item.name).suffix)) {

                store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', this.getImageObject(item, '/'))
              }
            }

            // 如果 userConfig.dirList 无 selectedDir，则切换显示根目录下（ / ）图片
            if (!this.isHasDir(this.userConfigInfo.selectedDir)) {
              this.userConfigInfo.selectedDir = '/'
            }
            this.dirChange(this.userConfigInfo.selectedDir)

          }
        })
      },

      isHasDir(selectedDir: any) {
        return this.userConfigInfo.dirList.some((v: any) => v.value === selectedDir)
      },

      // 获取指定目录的内容
      getDirContent(selectedDir: any) {

        this.loadingImageList = true

        const temp: any = {dir: selectedDir, imageList: []}

        axios.get(
          `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents/${selectedDir}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            }
          }
        ).then(res => {
          if (res && res.status === 200 && res.data.length > 0) {
            const tempImageList = []
            for (const item of res.data) {
              if (item.type === 'file' && isImage(filenameHandle(item.name).suffix)) {
                tempImageList.push(this.getImageObject(item, selectedDir))
              }
            }
            temp.imageList = tempImageList
            store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE_LIST', temp)
            this.loadingImageList = false
          }
        })
      },

      getImageObject(item: any, selectedDir: any) {
        if (isImage(filenameHandle(item.name).suffix)) {
          return {
            uuid: getUuid(),
            dir: selectedDir,
            name: item.name,
            path: item.path,
            sha: item.sha,
            github_url: generateExternalLink('github', item, this.userConfigInfo),
            cdn_url: generateExternalLink('cdn', item, this.userConfigInfo),
            markdown_gh: generateExternalLink('markdown_gh', item, this.userConfigInfo),
            markdown_cdn: generateExternalLink('markdown_cdn', item, this.userConfigInfo),
            deleting: false,
          }
        }
      },

      dirChange(dir: any) {
        const targetDirObj = this.dirImageList.find((v: any) => v.dir === dir)
        if (!targetDirObj || !targetDirObj.imageList.length) {
          this.getDirContent(dir)
          return
        }
        this.currentDirImageList = targetDirObj.imageList
      }
    })

    function dirChange(dir: string) {
      reactiveData.dirChange(dir)
    }

    onMounted(() => {
      reactiveData.initDirImageList()
    })

    watch(() => reactiveData.loggingStatus, (_n) => {
      !_n && router.push('/config')
    })


    watch(() => reactiveData.dirImageList, (_n: any) => {
        const temp = _n.find((v: any) => v.dir === reactiveData.userConfigInfo.selectedDir)
        if (temp) {
          reactiveData.currentDirImageList = temp.imageList
        }
      },
      {deep: true}
    )

    return {
      ...toRefs(reactiveData),
      dirChange
    }

  }
})
</script>

<style scoped lang="stylus">

@import "../style.styl"

$infoBarHeight = 50px;

.management-page-container {

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

        .repos-dir {

          .info-item {
            margin-right: 10px;

            &:last-child {
              margin-right: 0;
            }
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
        border: 1px solid #ddd;
        overflow-y: auto;
        box-sizing: border-box;

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
