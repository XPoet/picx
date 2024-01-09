<template>
  <div class="page-container config-page-container">
    <authorization-status-bar style="margin-bottom: 20rem" />

    <!-- GitHub Token -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      :label-position="setLabelPosition(userSettings)"
    >
      <!-- Token -->
      <el-form-item label="Token">
        <el-input
          ref="tokenInputRef"
          v-model="userConfigInfo.token"
          clearable
          :autofocus="!userConfigInfo.token"
          type="password"
          show-password
          :placeholder="$t('config_page.input_token')"
        ></el-input>
      </el-form-item>

      <!-- 一键配置 -->
      <el-form-item class="operation">
        <el-button
          plain
          :disabled="btnDisabled"
          type="primary"
          @click.prevent="oneClickAutoConfig(tokenInputRef)"
        >
          {{ $t('config_page.one_click_config') }}
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 基本信息 -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      :label-position="setLabelPosition(userSettings)"
      v-if="userConfigInfo.token && userConfigInfo.owner"
      v-loading="userInfoLoading"
      :element-loading-text="$t('config_page.loading_1')"
    >
      <!-- 用户名 -->
      <el-form-item v-if="userConfigInfo.owner" :label="$t('username')">
        <el-input v-model="userConfigInfo.owner" readonly></el-input>
      </el-form-item>

      <!-- 仓库 -->
      <el-form-item v-if="userConfigInfo.selectedRepo" :label="$t('repo')">
        <el-input v-model="userConfigInfo.selectedRepo" readonly />
      </el-form-item>
    </el-form>

    <!-- 目录 -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      :label-position="setLabelPosition(userSettings)"
      v-if="userConfigInfo.token && userConfigInfo.selectedBranch"
      v-loading="dirLoading"
      :element-loading-text="$t('config_page.loading_5')"
    >
      <!-- 目录模式 -->
      <el-form-item v-if="userConfigInfo.selectedBranch" :label="$t('config_page.dir_mode')">
        <el-radio-group v-model="userConfigInfo.dirMode" @change="dirModeChange">
          <el-radio label="rootDir">{{ $t('config_page.root_dir') }}</el-radio>

          <el-tooltip :content="$t('config_page.date_dir_tip')" placement="top" :offset="0">
            <el-radio label="dateDir">{{ $t('config_page.date_dir') }}</el-radio>
          </el-tooltip>

          <el-radio label="repoDir">
            {{ $t('config_page.repo_dir') }}
          </el-radio>

          <el-tooltip :content="$t('config_page.input_new_dir')" placement="top" :offset="0">
            <el-radio label="newDir">{{ $t('config_page.create_new_dir') }}</el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <!-- 日期目录 -->
      <el-form-item
        v-if="userConfigInfo.dirMode === DirModeEnum.dateDir"
        :label="$t('config_page.date_dir')"
      >
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <!-- 根目录 -->
      <el-form-item
        v-if="userConfigInfo.dirMode === DirModeEnum.rootDir"
        :label="$t('config_page.root_dir')"
      >
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <!-- 新建目录 -->
      <el-form-item
        v-if="userConfigInfo.dirMode === DirModeEnum.newDir"
        :label="$t('config_page.create_new_dir')"
      >
        <el-input
          ref="newDirInputRef"
          v-model="userConfigInfo.selectedDir"
          @input="persistUserConfigInfo()"
          clearable
          :placeholder="$t('config_page.placeholder_4')"
        ></el-input>
      </el-form-item>

      <!-- 仓库目录 -->
      <el-form-item
        v-if="userConfigInfo.dirList.length && userConfigInfo.dirMode === DirModeEnum.repoDir"
        :label="$t('config_page.select_dir')"
      >
        <repo-dir-cascader
          :el-key="repoDirCascaderKey"
          :el-size="userSettings.elementPlusSize"
          :style="{ width: 'calc(100% - ' + refreshIconWidth + 'rem)' }"
        />
        <el-icon
          class="refresh-icon"
          :style="{ width: refreshIconWidth + 'rem' }"
          @click="refreshDirData"
        >
          <IEpRefresh />
        </el-icon>
      </el-form-item>
    </el-form>

    <!-- 操作 -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      v-if="userConfigInfo.token"
      :label-position="setLabelPosition(userSettings)"
    >
      <el-form-item class="operation">
        <!-- 重置 -->
        <el-button plain :disabled="btnDisabled" @click="resetConfig()" v-if="userConfigInfo.owner">
          {{ $t('reset') }}
        </el-button>
        <!-- 确认 -->
        <el-button
          plain
          :disabled="btnDisabled"
          type="primary"
          @click="goUploadPage"
          v-if="userConfigInfo.selectedRepo"
        >
          {{ $t('confirm') }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from '@/stores'
import { DirModeEnum } from '@/common/model'
import { formatDatetime } from '@/utils'
import {
  goUploadPage,
  oneClickAutoConfig,
  persistUserConfigInfo,
  resetConfig,
  setLabelPosition,
  setLabelWidth
} from '@/views/picx-config/picx-config.util'
import router from '@/router'
import { isAuthorizeExpire } from '@/views/picx-login/picx-login.util'
import { getDirInfoList } from '@/common/api'
import i18n from '@/plugins/vue/i18n'

const store = useStore()

const userInfoLoading = ref(false)
const dirLoading = ref(false)
const branchLoading = ref(false)
const refreshIconWidth = ref(32)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const logined = computed(() => store.getters.getUserLoginStatus).value
const userSettings = computed(() => store.getters.getUserSettings).value
const btnDisabled = computed(() => userInfoLoading.value || dirLoading.value || branchLoading.value)

const newDirInputRef = ref<null | HTMLElement>(null)
const repoDirCascaderKey = ref<string>('repoDirCascaderKey')
const tokenInputRef = ref<HTMLElement | null>(null)

const dirModeChange = (dirMode: DirModeEnum) => {
  switch (dirMode) {
    case DirModeEnum.rootDir:
      // 根目录
      userConfigInfo.selectedDir = '/'
      break

    case DirModeEnum.dateDir:
      // 自动目录，根据当天日期自动生成
      userConfigInfo.selectedDir = formatDatetime('yyyyMMdd')
      break

    case DirModeEnum.newDir:
      // 手动输入的新建目录
      userConfigInfo.selectedDir = 'xxx'
      newDirInputRef.value?.focus()
      break

    case DirModeEnum.repoDir:
      // 仓库目录
      if (!userConfigInfo.dirList.length) {
        userConfigInfo.selectedDir = ''
        userConfigInfo.selectedDirList = []
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

watch(
  () => logined,
  (nv) => {
    if (!nv) {
      userInfoLoading.value = false
      dirLoading.value = false
      branchLoading.value = false
    }
  }
)

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
