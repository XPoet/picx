<template>
  <div class="page-container management-page-container">
    <div class="content-container">
      <div class="top">
        <div class="left">
          <selected-info-bar />
        </div>

        <div class="right flex-start">
          展示类型：
          <i :class="listing ? 'el-icon-tickets' : 'el-icon-menu'" @click.stop="toggleListing"></i>
          切换目录：
          <el-select v-model="userConfigInfo.selectedDir" placeholder="请选择" size="mini" @change="dirChange">
            <el-option
              v-for="(item, index) in userConfigInfo.dirList"
              :key="index"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
      </div>

      <div
        class="bottom"
        v-loading="loadingImageList"
        element-loading-text="加载中..."
        element-loading-background="rgba(0, 0, 0, 0.6)"
      >
        <ul class="image-list">
          <li
            class="image-item"
            v-for="(image, index) in currentDirImageList"
            :key="index"
            :style="{
              width: listing ? '50%' : '220px',
              height: listing ? '80px' : '230px'
            }"
          >
            <image-card :image-obj="image" :listing="listing" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRefs, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { filenameHandle, isImage } from '@/common/utils/fileHandleHelper'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import { UploadedImageModel } from '@/common/model/upload.model'
import generateExternalLink from '@/common/utils/generateExternalLink'
import getUuid from '@/common/utils/getUuid'
import axios from '@/common/utils/axios'
import imageCard from '@/components/image-card/image-card.vue'
import selectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'

export default defineComponent({
  name: 'management',

  components: {
    imageCard,
    selectedInfoBar
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
      listing: false,

      initDirImageList() {
        if (!this.dirImageList.length) {
          this.getReposContent()
          return
        }

        const { selectedDir } = this.userConfigInfo
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
        axios
          .get(`/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `token ${this.userConfigInfo.token}`
            }
          })
          .then((res) => {
            console.log('res: ', res)
            if (res && res.status === 200 && res.data.length > 0) {
              store.dispatch('DIR_IMAGE_LIST_ADD_DIR', '/')

              // eslint-disable-next-line no-restricted-syntax
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

        const temp: any = { dir: selectedDir, imageList: [] }

        axios
          .get(`/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents/${selectedDir}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `token ${this.userConfigInfo.token}`
            }
          })
          .then((res) => {
            if (res && res.status === 200 && res.data.length > 0) {
              const tempImageList: UploadedImageModel[] = []
              // eslint-disable-next-line no-restricted-syntax
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

      getImageObject(item: any, selectedDir: any): UploadedImageModel {
        return {
          uuid: getUuid(),
          dir: selectedDir,
          name: item.name,
          path: item.path,
          sha: item.sha,
          github_url: generateExternalLink(ExternalLinkType.gh, item, this.userConfigInfo),
          cdn_url: generateExternalLink(ExternalLinkType.cdn, item, this.userConfigInfo),
          md_gh_url: generateExternalLink(ExternalLinkType.md_gh, item, this.userConfigInfo),
          md_cdn_url: generateExternalLink(ExternalLinkType.md_cdn, item, this.userConfigInfo),
          deleting: false,
          is_transform_md: false
        }
      },

      dirChange(dir: any) {
        const targetDirObj = this.dirImageList.find((v: any) => v.dir === dir)
        if (!targetDirObj || !targetDirObj.imageList.length) {
          this.getDirContent(dir)
          return
        }
        this.currentDirImageList = targetDirObj.imageList
      },

      toggleListing() {
        this.listing = !this.listing
      }
    })

    function dirChange(dir: string) {
      reactiveData.dirChange(dir)
    }

    function toggleListing() {
      reactiveData.toggleListing()
    }

    onMounted(() => {
      reactiveData.initDirImageList()
    })

    watch(
      () => reactiveData.loggingStatus,
      (_n: boolean) => {
        // eslint-disable-next-line no-unused-expressions
        !_n && router.push('/config')
      }
    )

    watch(
      () => reactiveData.dirImageList,
      (_n: any) => {
        const temp = _n.find((v: any) => v.dir === reactiveData.userConfigInfo.selectedDir)
        if (temp) {
          reactiveData.currentDirImageList = temp.imageList
        }
      },
      { deep: true }
    )

    return {
      ...toRefs(reactiveData),
      dirChange,
      toggleListing
    }
  }
})
</script>

<style scoped lang="stylus">
@import 'management.styl';
</style>
