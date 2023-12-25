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
          :placeholder="$t('config.inputToken')"
        ></el-input>
      </el-form-item>

      <!-- 配置按钮组 -->
      <el-form-item class="operation">
        <el-tooltip placement="top" :content="$t('config.manualConfiguration3')">
          <el-button
            :disabled="btnDisabled"
            plain
            type="info"
            native-type="submit"
            @click.prevent="getUserInfo()"
          >
            {{ reConfig ? $t('config.manualConfiguration1') : $t('config.manualConfiguration2') }}
          </el-button>
        </el-tooltip>
        <el-tooltip placement="top" :content="$t('config.autoConfiguration3')">
          <el-button
            plain
            :disabled="btnDisabled"
            type="primary"
            @click.prevent="oneClickAutoConfig"
          >
            {{ reConfig ? $t('config.autoConfiguration1') : $t('config.autoConfiguration2') }}
          </el-button>
        </el-tooltip>
      </el-form-item>
    </el-form>

    <!-- 基本信息 -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      :label-position="setLabelPosition(userSettings)"
      v-if="userConfigInfo.token && userConfigInfo.owner"
      v-loading="userInfoLoading"
      :element-loading-text="$t('config.loading1')"
    >
      <!-- 用户名 -->
      <el-form-item v-if="userConfigInfo.owner" :label="$t('config.username')">
        <el-input v-model="userConfigInfo.owner" readonly></el-input>
      </el-form-item>

      <!-- 邮箱 -->
      <el-form-item v-if="userConfigInfo.email" :label="$t('config.email')">
        <el-input v-model="userConfigInfo.email" readonly></el-input>
      </el-form-item>

      <!-- 仓库 -->
      <el-form-item v-if="userConfigInfo.repoList.length" :label="$t('config.selectRepo')">
        <el-select
          v-model="userConfigInfo.selectedRepo"
          :filterable="true"
          :style="{ width: 'calc(100% - ' + refreshBoxWidth + 'rem)' }"
          :placeholder="$t('config.placeholder1')"
          @change="selectRepo"
        >
          <el-option
            v-for="(repo, index) in userConfigInfo.repoList"
            :key="index"
            :label="repo.label"
            :value="repo.value"
          >
          </el-option>
        </el-select>
        <refresh-config :box-width="refreshBoxWidth" data-type="repo" />
      </el-form-item>
    </el-form>

    <!-- 分支 -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      :label-position="setLabelPosition(userSettings)"
      v-if="userConfigInfo.token && userConfigInfo.selectedRepo && userConfigInfo.branchList.length"
      v-loading="branchLoading"
      :element-loading-text="$t('config.loading2')"
    >
      <!-- 选择分支 -->
      <el-form-item
        v-if="
          userConfigInfo.branchList.length &&
          userConfigInfo.branchMode === BranchModeEnum.repoBranch
        "
        :label="$t('config.selectBranch')"
      >
        <el-select
          v-model="userConfigInfo.selectedBranch"
          :filterable="true"
          :style="{ width: 'calc(100% - ' + refreshBoxWidth + 'rem)' }"
          :placeholder="$t('config.placeholder2')"
          @change="selectBranch"
        >
          <el-option
            v-for="(repo, repoIndex) in userConfigInfo.branchList"
            :key="repoIndex"
            :label="repo.label"
            :value="repo.value"
          >
          </el-option>
        </el-select>
        <refresh-config :box-width="refreshBoxWidth" data-type="branch" />
      </el-form-item>
    </el-form>

    <!-- 目录 -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      :label-position="setLabelPosition(userSettings)"
      v-if="userConfigInfo.token && userConfigInfo.selectedBranch"
      v-loading="dirLoading"
      :element-loading-text="$t('config.loading5')"
    >
      <el-form-item v-if="userConfigInfo.selectedBranch" :label="$t('config.dirMode')">
        <el-radio-group v-model="userConfigInfo.dirMode" @change="dirModeChange">
          <el-tooltip :content="$t('config.inputNewDir')" placement="top" :offset="-1">
            <el-radio label="newDir">{{ $t('config.createNewDir') }}</el-radio>
          </el-tooltip>

          <el-tooltip
            :content="$t('config.rootDir2', { branch: userConfigInfo.selectedBranch })"
            placement="top"
            :offset="-1"
          >
            <el-radio label="rootDir">{{ $t('config.rootDir') }}</el-radio>
          </el-tooltip>

          <el-tooltip :content="$t('config.autoDir2')" placement="top" :offset="-1">
            <el-radio label="autoDir">{{ $t('config.autoDir') }}</el-radio>
          </el-tooltip>

          <el-tooltip
            v-if="userConfigInfo.dirList.length && userConfigInfo.branchMode !== 'newBranch'"
            :content="$t('config.repoDir2', { branch: userConfigInfo.selectedBranch })"
            placement="top"
            :offset="-1"
          >
            <el-radio label="repoDir">
              {{ $t('config.repoDir', { repo: userConfigInfo.selectedRepo }) }}
            </el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'autoDir'" :label="$t('config.autoDir')">
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'rootDir'" :label="$t('config.rootDir')">
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'newDir'" :label="$t('config.createNewDir')">
        <el-input
          ref="newDirInputRef"
          v-model="userConfigInfo.selectedDir"
          @input="persistUserConfigInfo()"
          clearable
          :placeholder="$t('config.placeholder4')"
        ></el-input>
      </el-form-item>

      <el-form-item
        v-if="
          userConfigInfo.dirList.length &&
          userConfigInfo.dirMode === 'repoDir' &&
          userConfigInfo.branchMode !== 'newBranch'
        "
        :label="$t('config.selectDir')"
      >
        <repo-dir-cascader :el-key="repoDirCascaderKey" :el-size="userSettings.elementPlusSize" />
      </el-form-item>
    </el-form>

    <!-- 操作（重置、确认） -->
    <el-form
      :label-width="setLabelWidth(userSettings)"
      v-if="userConfigInfo.token"
      :label-position="setLabelPosition(userSettings)"
    >
      <el-form-item class="operation">
        <el-button
          plain
          :disabled="btnDisabled"
          type="warning"
          @click="resetConfig()"
          v-if="userConfigInfo.owner"
        >
          {{ $t('reset') }}
        </el-button>
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
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import { useStore } from '@/stores'
import { BranchModeEnum, DirModeEnum } from '@/common/model'
import { formatDatetime } from '@/utils'
import {
  getAllRepoList,
  getBranchInfoList,
  getDirInfoList,
  getGitHubUserInfo,
  initEmptyRepo
} from '@/common/api'
import { GH_PAGES, INIT_REPO_BARNCH } from '@/common/constant'
import {
  goUploadPage,
  initReHandConfig,
  oneClickAutoConfig,
  persistUserConfigInfo,
  resetConfig,
  saveUserInfo,
  setLabelPosition,
  setLabelWidth
} from '@/views/my-config/my-config.util'
import router from '@/router'
import { isAuthorizeExpire } from '@/views/picx-login/picx-login.util'

const store = useStore()
const instance = getCurrentInstance()

const userInfoLoading = ref(false)
const dirLoading = ref(false)
const branchLoading = ref(false)
const refreshBoxWidth = ref(32)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const logined = computed(() => store.getters.getUserLoginStatus).value
const userSettings = computed(() => store.getters.getUserSettings).value
const reConfig = computed(() => !userConfigInfo.token || !userConfigInfo.owner)
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

    case DirModeEnum.autoDir:
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

async function getRepoList(owner: string) {
  const repoList = await getAllRepoList(owner)
  console.log('getAllRepoList >> ', repoList)
  userInfoLoading.value = false
  if (repoList) {
    userConfigInfo.repoList = repoList
    await persistUserConfigInfo()
  } else {
    ElMessage.error({ message: instance?.proxy?.$t('config.message9') })
  }
}

async function getDirList() {
  dirLoading.value = true
  const dirList = await getDirInfoList(userConfigInfo)
  console.log('getDirInfoList >> ', dirList)
  dirLoading.value = false
  if (dirList) {
    userConfigInfo.dirList = dirList
  }
  await persistUserConfigInfo()
}

async function getBranchList(repo: string) {
  branchLoading.value = true
  const { owner, dirMode } = userConfigInfo
  const branchInfoList = await getBranchInfoList(owner, repo)
  console.log('getBranchInfoList >> ', branchInfoList)
  branchLoading.value = false
  if (branchInfoList.length > 0) {
    userConfigInfo.branchList = branchInfoList.filter((x) => x.value !== GH_PAGES)
    userConfigInfo.selectedBranch = userConfigInfo.branchList[0].value
    userConfigInfo.branchMode = BranchModeEnum.repoBranch
    await getDirList()
  } else {
    userConfigInfo.selectedBranch = INIT_REPO_BARNCH
    userConfigInfo.branchMode = BranchModeEnum.newBranch

    // 当分支列表为空时，判定该仓库为空仓库，需要初始化
    await initEmptyRepo(userConfigInfo)
  }
  dirModeChange(dirMode)
  await persistUserConfigInfo()
}

async function getUserInfo() {
  if (!userConfigInfo.token) {
    ElMessage.error({ message: instance?.proxy?.$t('config.message1') })
    return
  }

  if (!reConfig.value) {
    initReHandConfig()
  }

  userInfoLoading.value = true
  const userInfo = await getGitHubUserInfo(userConfigInfo.token)
  console.log('getGitHubUserInfo >> ', userInfo)

  if (!userInfo) {
    ElMessage.error({ message: instance?.proxy?.$t('config.message11') })
    return
  }

  if (!store.getters.getGitHubAuthorizationInfo.isAutoAuthorize) {
    await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
      manualToken: userConfigInfo.token
    })
  }

  await saveUserInfo(userInfo)
  await getRepoList(userInfo.login)
}

function selectRepo(repo: string) {
  userConfigInfo.branchList = []
  userConfigInfo.dirList = []
  store.dispatch('DIR_IMAGE_LOGOUT')
  getBranchList(repo)
  persistUserConfigInfo()
}

async function selectBranch(branch: string) {
  userConfigInfo.selectedBranch = branch
  await getDirList()
  repoDirCascaderKey.value = userConfigInfo.selectedBranch
  userConfigInfo.selectedDir = userConfigInfo.dirList[0].value
  userConfigInfo.selectedDirList = [userConfigInfo.selectedDir]
  await persistUserConfigInfo()
}

const authorizeAutoConfig = () => {
  const { token, isAutoAuthorize } = computed(() => store.getters.getGitHubAuthorizationInfo).value

  if (isAutoAuthorize && token && !isAuthorizeExpire() && router.currentRoute.value.query.auto) {
    oneClickAutoConfig()
  }
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
@import "./my-config.styl"
</style>
