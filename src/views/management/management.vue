<template>
  <div class="page-container management-page-container">
    <div class="content-container">
      <div class="top">
        <div class="left">
          <selected-info-bar @selected-dir-change="dirChange" />
        </div>
        <div class="right flex-start">
          <el-tooltip
            placement="top"
            :content="listing ? '切换方块展示' : '切换列表展示'"
          >
            <i
              class="btn-icon"
              :class="listing ? 'el-icon-tickets' : 'el-icon-menu'"
              @click.stop="toggleListing"
            ></i>
          </el-tooltip>
          <el-tooltip placement="top" content="重新加载图片">
            <i class="btn-icon el-icon-refresh" @click.stop="reloadPics"></i>
          </el-tooltip>
        </div>
      </div>

      <div
        class="bottom"
        v-loading="loadingImageList"
        element-loading-text="加载中..."
        element-loading-background="rgba(0, 0, 0, 0.5)"
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
import { filenameHandle, isImage } from '@/common/utils/file-handle-helper'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import { UploadedImageModel } from '@/common/model/upload.model'
import generateExternalLink from '@/common/utils/generate-external-link'
import getUuid from '@/common/utils/get-uuid'
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
      userConfigInfo: computed(
        (): UserConfigInfoModel => store.getters.getUserConfigInfo
      ),
      loggingStatus: computed(() => store.getters.getUserLoggingStatus),
      dirImageList: computed(() => store.getters.getDirImageList),

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
          .get(
            `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `token ${this.userConfigInfo.token}`
              }
            }
          )
          .then((res) => {
            console.log('[getReposContent] ', res)
            if (res && res.status === 200 && res.data.length > 0) {
              store.dispatch('DIR_IMAGE_LIST_ADD_DIR', '/')

              // eslint-disable-next-line no-restricted-syntax
              for (const item of res.data) {
                if (item.type === 'dir') {
                  store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.name)
                } else if (
                  item.type === 'file' &&
                  isImage(filenameHandle(item.name).suffix)
                ) {
                  store.dispatch(
                    'DIR_IMAGE_LIST_ADD_IMAGE',
                    this.getImageObject(item, '/')
                  )
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
          .get(
            `/repos/${this.userConfigInfo?.owner}/${this.userConfigInfo?.selectedRepos}/contents/${selectedDir}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `token ${this.userConfigInfo.token}`
              }
            }
          )
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
          github_url: generateExternalLink(
            ExternalLinkType.gh,
            item,
            this.userConfigInfo
          ),
          cdn_url: generateExternalLink(ExternalLinkType.cdn, item, this.userConfigInfo),
          md_gh_url: generateExternalLink(
            ExternalLinkType.md_gh,
            item,
            this.userConfigInfo
          ),
          md_cdn_url: generateExternalLink(
            ExternalLinkType.md_cdn,
            item,
            this.userConfigInfo
          ),
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

    function reloadPics() {
      store.dispatch('DIR_IMAGE_LOGOUT')
      reactiveData.initDirImageList()
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
        const temp = _n.find(
          (v: any) => v.dir === reactiveData.userConfigInfo.selectedDir
        )
        if (temp) {
          reactiveData.currentDirImageList = temp.imageList
        }
      },
      { deep: true }
    )

    return {
      ...toRefs(reactiveData),
      dirChange,
      reloadPics,
      toggleListing
    }
  }
})
</script>

<style scoped lang="stylus">
@import 'management.styl';
</style>
