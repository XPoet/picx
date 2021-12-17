<template>
  <div
    class="page-container management-page-container"
    @contextmenu.prevent="menu"
    v-loading="loadingPageStatus"
    element-loading-text="加载中..."
    element-loading-background="rgba(255, 255, 255, 0.7)"
    @click="menuType = ''"
  >
    <div @click.stop="closeMenuBox">
      <transition name="fade">
        <div v-show="menuType == 'blank'" class="menu-box" :style="menuStyle">
          <li @click="menuFn('refresh')">刷新</li>
          <li @click="menuFn('addFolder')">新建文件夹</li>
          <li @click="menuFn('upImage')">上传图片</li>
        </div>
      </transition>

      <transition name="fade">
        <div v-show="menuType == 'dir'" class="menu-box" :style="menuItemStyle">
          <li @click="menuFn('openFolder')">打开文件夹</li>
          <li @click="menuFn('deleteFolder')">删除文件夹</li>
          <li @click="menuFn('openFolderDetail')">属性</li>
        </div>
      </transition>

      <transition name="fade">
        <div v-show="menuType == 'image'" class="menu-box" :style="menuItemStyle">
          <li @click="menuFn('copyGithubUrl')">复制 Github 链接</li>
          <li @click="menuFn('copyCDNUrl')">复制 CDN 链接</li>
          <li @click="menuFn('copyMarkdownGithubUrl')">复制 Markdown 格式 Github 链接</li>
          <li @click="menuFn('copyMarkdownCDNUrl')">复制 Markdown 格式 CDN 链接</li>
          <li @click="menuFn('deleteImage')">删除图片</li>
          <li @click="menuFn('openImageDetail')">属性</li>
        </div>
      </transition>
    </div>
    <div class="content-container">
      <div class="top">
        <div class="left">
          <selected-info-bar @selected-dir-change="selectDirChange" />
        </div>
      </div>
      <div class="bottom">
        <ul class="list">
          <li
            v-show="
              curContentList.length > 0 && curContentList[0].path.split('/').length > 1
            "
            class="item"
          >
            <folder-card @dblclick="backDir"></folder-card>
          </li>
          <li
            class="item"
            @contextmenu.prevent.stop="itemMenu($event, item)"
            v-for="(item, index) in curContentList"
            v-show="item.type == 'dir'"
            :key="index"
          >
            <folder-card
              v-if="item.type == 'dir'"
              :folderObj="item"
              @dblclick="currentPath = item.path"
            ></folder-card>
          </li>
          <li
            class="item"
            @contextmenu.prevent.stop="itemMenu($event, item)"
            v-for="(item, index) in curContentList"
            v-show="item.type == 'image'"
            :key="index"
          >
            <new-image-card v-if="item.type == 'image'" :imageObj="item"></new-image-card>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <el-dialog
    v-model="dialogUploadImage"
    title="上传图片"
    width="1000px"
    destroy-on-close
    top="5vh"
    @close="getReposContent()"
  >
    <div class="upload-dialog"><upload-dialog></upload-dialog></div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useStore } from '@/store'
import { filenameHandle, isImage } from '@/common/utils/file-handle-helper'
import { UserConfigInfoModel } from '@/common/model/user-config-info.model'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import { UploadedImageModel } from '@/common/model/upload.model'
import generateExternalLink from '@/common/utils/generate-external-link'
import getUuid from '@/common/utils/get-uuid'
import axios from '@/common/utils/axios'
import menuUtil from '../../common/utils/menu-util.ts'

import newImageCard from '@/components/new-image-card/new-image-card.vue'
import folderCard from '@/components/folder-card/folder-card.vue'
import uploadDialog from '@/components/upload-dialog/upload-dialog.vue'

import selectedInfoBar from '@/components/selected-info-bar/selected-info-bar.vue'

const store = useStore()

const userConfigInfo = computed(
  (): UserConfigInfoModel => store.getters.getUserConfigInfo
)

const loadingPageStatus = ref(false)
const dialogUploadImage = ref(false)

// 当前
const curContentList = ref([] as any)
const currentPath = ref<String>(userConfigInfo.value.selectedDir)

// 右键菜单
const menuStyle = ref<String>('')
const menuItemStyle = ref<String>('')
const menuType = ref<String>('')
const menuItemObj = ref<Object>({})

// 右键空白处菜单列表
function menu(e: any) {
  menuType.value = 'blank'
  menuStyle.value = ` left: ${e.pageX + 10}px;top:${e.pageY + 10}px;`
}
// 右键item菜单列表
function itemMenu(e: any, item: any) {
  menuType.value = item.type
  menuItemObj.value = item
  menuItemStyle.value = ` left: ${e.pageX + 10}px;top:${e.pageY + 10}px;`
}
// 延时 防止关闭过快 影响点击事件视觉效果
function closeMenuBox() {
  setTimeout(() => {
    menuType.value = ''
  }, 100)
}

// 监听当前path变化
watch(
  () => currentPath.value,
  () => {
    getReposContent()
  }
)
// 返回上一级
function backDir() {
  const opath: any = curContentList.value[0].path
  const pos: Number = opath.lastIndexOf('/')
  const path: any = opath.substr(0, opath.lastIndexOf('/', opath.lastIndexOf('/') - 1))
  if (curContentList.value[0].path.split('/').length > 2) {
    currentPath.value = path
  } else {
    currentPath.value = '/'
  }
}
// 图片格式化
function getImageObject(item: any, selectedDir: string): UploadedImageModel {
  return {
    uuid: getUuid(),
    dir: selectedDir,
    name: item.name,
    path: item.path,
    sha: item.sha,
    github_url: generateExternalLink(ExternalLinkType.gh, item, userConfigInfo.value),
    cdn_url: generateExternalLink(ExternalLinkType.cdn, item, userConfigInfo.value),
    md_gh_url: generateExternalLink(ExternalLinkType.md_gh, item, userConfigInfo.value),
    md_cdn_url: generateExternalLink(ExternalLinkType.md_cdn, item, userConfigInfo.value),
    deleting: false,
    is_transform_md: false,
    size: item.size
  }
}

// 根据路径获取当前对象
async function getReposContent() {
  loadingPageStatus.value = true
  return new Promise<void>((resolve, reject) => {
    axios
      .get(
        `/repos/${userConfigInfo.value.owner}/${userConfigInfo.value.selectedRepos}/contents${currentPath.value}`
      )
      .then((res) => {
        userConfigInfo.value.selectedDir = currentPath.value || '/'
        store.dispatch('USER_CONFIG_INFO_PERSIST')
        if (res.status == 401) {
          ElMessage.error('非法访问，请检查token是否正确')
        }
        const list = res.data.map((item: any) => {
          if (item.type === 'file' && isImage(filenameHandle(item.name).suffix)) {
            item = getImageObject(item, currentPath.value)
            item.type = 'image'
          }
          return item
        })
        loadingPageStatus.value = false
        curContentList.value = list
        resolve()
      })
  })
}

function selectDirChange(value) {
  currentPath.value = value
}

// 菜单指令
async function menuFn(type: String) {
  switch (type) {
    case 'refresh': {
      getReposContent()
      break
    }
    case 'addFolder': {
      const code = await menuUtil.addFolder(userConfigInfo.value)
      if (code === 200) {
        getReposContent()
      }
      break
    }
    case 'deleteFolder': {
      const code = await menuUtil.deleteFolder(userConfigInfo.value, menuItemObj.value)
      if (code === 200) {
        getReposContent()
      }
      break
    }
    case 'upImage': {
      dialogUploadImage.value = true
      break
    }
    case 'openFolder': {
      currentPath.value = menuItemObj.value.path
      break
    }

    case 'openFolderDetail': {
      menuUtil.openFolderDetail(menuItemObj.value)
      break
    }

    case 'copyGithubUrl': {
      menuUtil.copyGithubUrl(menuItemObj.value)
      break
    }
    case 'copyCDNUrl': {
      menuUtil.copyCDNUrl(menuItemObj.value)
      break
    }
    case 'copyMarkdownGithubUrl': {
      menuUtil.copyMarkdownGithubUrl(menuItemObj.value)
      break
    }
    case 'copyMarkdownCDNUrl': {
      menuUtil.copyMarkdownCDNUrl(menuItemObj.value)
      break
    }
    case 'deleteImage': {
      const code = await menuUtil.deleteImage(userConfigInfo.value, menuItemObj.value)
      if (code === 200) {
        getReposContent()
      }
      break
    }
    case 'openImageDetail': {
      menuUtil.openImageDetail(menuItemObj.value)
      break
    }
    default: {
      break
    }
  }
}

onMounted(() => {
  getReposContent()
})
</script>

<style scoped lang="stylus">
@import 'management.styl';
</style>
