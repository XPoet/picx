<template>
  <div class="page-container config-page-container">
    <authorization-status-bar class="row-item" />

    <!-- GitHub Token -->
    <div class="row-item token">
      <el-input
        ref="tokenInputRef"
        v-model="userConfigInfo.token"
        clearable
        :autofocus="!userConfigInfo.token"
        show-password
        :placeholder="$t('config_page.input_token')"
        @keydown.enter="oneClickAutoConfig(tokenInputRef)"
      />
      <el-button plain type="primary" @click="oneClickAutoConfig(tokenInputRef)">
        {{ $t('config_page.one_click_config') }}
      </el-button>
    </div>

    <!-- 基本信息 -->
    <el-descriptions class="row-item" v-if="userConfigInfo.token" :column="2" border>
      <!-- 用户名 -->
      <el-descriptions-item v-if="userConfigInfo.owner">
        <template #label>
          <div class="cell-item">
            <el-icon><IEpUser /></el-icon>
            {{ $t('username') }}
          </div>
        </template>
        <el-link type="primary" :href="getGitHubOwnerURL(userConfigInfo)" target="_blank">
          {{ userConfigInfo.owner }}
        </el-link>
      </el-descriptions-item>

      <!-- 仓库 -->
      <el-descriptions-item v-if="userConfigInfo.repo">
        <template #label>
          <div class="cell-item">
            <el-icon><IEpConnection /></el-icon>
            {{ $t('repo') }}
          </div>
        </template>
        <div class="repo-descriptions-item">
          <el-link type="primary" :href="getImageHostingURL(userConfigInfo)" target="_blank">
            {{ userConfigInfo.repo }}
          </el-link>
          <copy-source-repo />
        </div>
      </el-descriptions-item>

      <!-- 目录  -->
      <el-descriptions-item :span="2" v-if="userConfigInfo.repo && userConfigInfo.branch">
        <template #label>
          <div class="cell-item">
            <el-icon><IEpFolder /></el-icon>
            {{ $t('dir') }}
          </div>
        </template>
        <div class="dir-box border-box">
          <el-radio-group class="dir-item" v-model="userConfigInfo.dirMode" @change="dirModeChange">
            <el-radio label="rootDir">{{ $t('config_page.root_dir') }}</el-radio>
            <el-tooltip :content="$t('config_page.date_dir_tip')" placement="top" :offset="0">
              <el-radio label="dateDir">{{ $t('config_page.date_dir') }}</el-radio>
            </el-tooltip>
            <el-radio label="repoDir" v-if="userConfigInfo.dirList.length">
              {{ $t('config_page.repo_dir') }}
            </el-radio>
            <el-tooltip :content="$t('config_page.input_new_dir')" placement="top" :offset="0">
              <el-radio label="newDir">{{ $t('config_page.create_new_dir') }}</el-radio>
            </el-tooltip>
          </el-radio-group>

          <!-- 根目录 / 日期目录 -->
          <el-input
            class="dir-item"
            v-if="
              userConfigInfo.dirMode === DirModeEnum.rootDir ||
              userConfigInfo.dirMode === DirModeEnum.dateDir
            "
            v-model="userConfigInfo.selectedDir"
            readonly
          ></el-input>

          <!-- 新建目录 -->
          <el-input
            class="dir-item"
            v-if="userConfigInfo.dirMode === DirModeEnum.newDir"
            ref="newDirInputRef"
            v-model="userConfigInfo.selectedDir"
            @input="persistUserConfigInfo()"
            clearable
            :placeholder="$t('config_page.placeholder_4')"
          ></el-input>

          <!-- 仓库目录 -->
          <div class="dir-item" v-if="userConfigInfo.dirMode === DirModeEnum.repoDir">
            <repo-dir-cascader
              :el-key="repoDirCascaderKey"
              :el-size="globalSettings.elementPlusSize"
              :el-clearable="true"
              :style="{ width: 'calc(100% - ' + refreshIconWidth + 'rem)' }"
            />
            <el-icon
              class="refresh-icon"
              :style="{ width: refreshIconWidth + 'rem' }"
              @click="refreshDirData"
            >
              <IEpRefresh />
            </el-icon>
          </div>
        </div>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 确定 -->
    <el-button
      class="row-item confirm-btn"
      v-if="userConfigInfo.token && userConfigInfo.repo && userConfigInfo.branch"
      plain
      type="primary"
      @click="goUploadPage(newDirInputRef)"
    >
      {{ $t('confirm') }}
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from '@/stores'
import { DirModeEnum } from '@/common/model'
import { formatDatetime, getGitHubOwnerURL, getImageHostingURL } from '@/utils'
import {
  goUploadPage,
  oneClickAutoConfig,
  persistUserConfigInfo
} from '@/views/picx-config/picx-config.util'
import router from '@/router'
import { isAuthorizeExpire } from '@/views/picx-login/picx-login.util'
import { getDirInfoList } from '@/common/api'
import i18n from '@/plugins/vue/i18n'

const store = useStore()

const refreshIconWidth = ref(32)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value

const newDirInputRef = ref<null | HTMLElement>(null)
const tokenInputRef = ref<HTMLElement | null>(null)
const repoDirCascaderKey = ref<string>('repoDirCascaderKey')

const dirModeChange = (dirMode: DirModeEnum) => {
  switch (dirMode) {
    // 根目录
    case DirModeEnum.rootDir:
      userConfigInfo.selectedDir = '/'
      break

    // 日期目录，根据当天日期自动生成
    case DirModeEnum.dateDir:
      userConfigInfo.selectedDir = formatDatetime('yyyyMMdd')
      break

    // 手动输入的新建目录
    case DirModeEnum.newDir:
      if (userConfigInfo.selectedDirList.length) {
        userConfigInfo.selectedDir = userConfigInfo.selectedDirList.join('/')
      } else {
        userConfigInfo.selectedDir = 'xxx'
      }
      newDirInputRef.value?.focus()
      break

    // 仓库目录
    case DirModeEnum.repoDir:
      userConfigInfo.selectedDir = ''
      if (userConfigInfo.selectedDirList.length) {
        userConfigInfo.selectedDir = userConfigInfo.selectedDirList.join('/')
      }
      break

    default:
      userConfigInfo.selectedDir = '/'
      break
  }
  persistUserConfigInfo()
}

const authorizeAutoConfig = () => {
  const { token, isAutoAuthorize } = computed(() => store.getters.getGitHubAuthorizationInfo).value

  if (isAutoAuthorize && token && !isAuthorizeExpire() && router.currentRoute.value.query.auto) {
    oneClickAutoConfig(tokenInputRef.value)
  }
}

const refreshDirData = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: i18n.global.t('config_page.loading_4')
  })
  userConfigInfo.dirList = await getDirInfoList(userConfigInfo)
  loading.close()
  await store.dispatch('USER_CONFIG_INFO_PERSIST')
}

onMounted(() => {
  setTimeout(() => {
    if (!userConfigInfo.token || router.currentRoute.value.query.focus === '1') {
      tokenInputRef.value?.focus()
    }
    authorizeAutoConfig()
  }, 100)
})
</script>

<style scoped lang="stylus">
@import "picx-config.styl"
</style>
