<template>
  <div class="page-container config-page-container">
    <!-- GitHub Token -->
    <el-form label-width="70rem" :label-position="labelPosition">
      <el-form-item label="Token">
        <el-input
          v-model="userConfigInfo.token"
          clearable
          :autofocus="!userConfigInfo.token"
          type="password"
          show-password
          placeholder="请输入 GitHub Token"
        ></el-input>
      </el-form-item>

      <el-form-item class="operation">
        <el-tooltip placement="top" content="选择现有的 GitHub 仓库">
          <el-button
            :disabled="btnDisabled"
            plain
            type="primary"
            native-type="submit"
            @click.prevent="getUserInfo()"
          >
            {{ reConfig ? '' : '重新' }}手动配置
          </el-button>
        </el-tooltip>
        <el-tooltip placement="top" content="自动创建 GitHub 仓库">
          <el-button
            plain
            :disabled="btnDisabled"
            type="primary"
            @click.prevent="oneClickAutoConfig()"
          >
            {{ reConfig ? '' : '重新' }}一键自动配置
          </el-button>
        </el-tooltip>
      </el-form-item>
    </el-form>

    <!-- 基本信息 -->
    <el-form
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.token && userConfigInfo.owner"
      v-loading="userInfoLoading"
      element-loading-text="正在加载用户信息..."
    >
      <el-form-item v-if="userConfigInfo.owner" label="用户名">
        <el-input v-model="userConfigInfo.owner" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.email" label="邮箱">
        <el-input v-model="userConfigInfo.email" readonly></el-input>
      </el-form-item>

      <!-- 仓库 -->
      <el-form-item v-if="userConfigInfo.repoList.length" label="选择仓库">
        <el-select
          v-model="userConfigInfo.selectedRepo"
          :filterable="true"
          :style="{ width: 'calc(100% - ' + refreshBoxWidth + 'rem)' }"
          placeholder="请选择图床仓库..."
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
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.token && userConfigInfo.selectedRepo && userConfigInfo.branchList.length"
      v-loading="branchLoading"
      element-loading-text="正在加载分支信息..."
    >
      <!-- 由于 GitHub API 目前不支持创建空分支，该功能暂时无法使用 -->
      <el-form-item v-if="userConfigInfo.selectedRepo && 0" label="分支方式">
        <el-radio-group v-model="userConfigInfo.branchMode" @change="branchModeChange">
          <el-tooltip
            v-if="userConfigInfo.branchList.length"
            :content="'选择 ' + userConfigInfo.selectedRepo + ' 仓库下的一个分支'"
            placement="top"
          >
            <el-radio label="repoBranch">
              选择 {{ userConfigInfo.selectedRepo }} 仓库下的分支
            </el-radio>
          </el-tooltip>
          <el-tooltip content="手动创建一个新分支" placement="top">
            <el-radio label="newBranch">新建分支</el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <!-- 选择分支 -->
      <el-form-item
        v-if="
          userConfigInfo.branchList.length &&
          userConfigInfo.branchMode === BranchModeEnum.repoBranch
        "
        label="选择分支"
      >
        <el-select
          v-model="userConfigInfo.selectedBranch"
          :filterable="true"
          :style="{ width: 'calc(100% - ' + refreshBoxWidth + 'rem)' }"
          placeholder="请选择分支..."
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

      <!-- 新建分支 -->
      <el-form-item v-if="userConfigInfo.branchMode === BranchModeEnum.newBranch" label="新建分支">
        <el-input
          v-model="newBranchInputVal"
          @blur="onNewBranchInputBlur"
          clearable
          placeholder="请输入新建的分支..."
          ref="newBranchInputRef"
        ></el-input>
      </el-form-item>
    </el-form>

    <!-- 目录 -->
    <el-form
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.token && userConfigInfo.selectedBranch"
      v-loading="dirLoading"
      element-loading-text="正在加载目录信息..."
    >
      <el-form-item v-if="userConfigInfo.selectedBranch" label="目录方式">
        <el-radio-group v-model="userConfigInfo.dirMode" @change="dirModeChange">
          <el-tooltip content="手动输入一个新目录" placement="top" :offset="-1">
            <el-radio label="newDir">新建目录</el-radio>
          </el-tooltip>

          <el-tooltip
            :content="'图片存储在 ' + userConfigInfo.selectedBranch + ' 分支的根目录下'"
            placement="top"
            :offset="-1"
          >
            <el-radio label="rootDir">根目录</el-radio>
          </el-tooltip>

          <el-tooltip
            :content="'根据日期自动创建格式 YYYYMMDD 的目录'"
            placement="top"
            :offset="-1"
          >
            <el-radio label="autoDir">自动目录</el-radio>
          </el-tooltip>

          <el-tooltip
            v-if="userConfigInfo.dirList.length && userConfigInfo.branchMode !== 'newBranch'"
            :content="'选择 ' + userConfigInfo.selectedBranch + ' 分支下的一个目录'"
            placement="top"
            :offset="-1"
          >
            <el-radio label="repoDir"> 选择 {{ userConfigInfo.selectedRepo }} 仓库目录 </el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'autoDir'" label="自动目录">
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'rootDir'" label="根目录">
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'newDir'" label="新建目录">
        <el-input
          ref="newDirInputRef"
          v-model="userConfigInfo.selectedDir"
          @input="persistUserConfigInfo()"
          clearable
          placeholder="请输入新建的目录..."
        ></el-input>
      </el-form-item>

      <el-form-item
        v-if="
          userConfigInfo.dirList.length &&
          userConfigInfo.dirMode === 'repoDir' &&
          userConfigInfo.branchMode !== 'newBranch'
        "
        label="选择目录"
      >
        <repo-dir-cascader :el-key="repoDirCascaderKey" :el-size="userSettings.elementPlusSize" />
      </el-form-item>
    </el-form>

    <!-- 操作（重置、确认配置） -->
    <el-form label-width="70rem" v-if="userConfigInfo.token" :label-position="labelPosition">
      <el-form-item class="operation">
        <el-button
          plain
          :disabled="btnDisabled"
          type="warning"
          @click="resetConfig()"
          v-if="userConfigInfo.owner"
        >
          重置
        </el-button>
        <el-button
          plain
          :disabled="btnDisabled"
          type="success"
          @click="goUploadPage()"
          v-if="userConfigInfo.selectedRepo"
        >
          确认
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useStore } from '@/store'
import { BranchModeEnum, BranchModel, DirModeEnum, ElementPlusSizeEnum } from '@/common/model'
import { formatDatetime } from '@/utils'
import {
  getBranchInfoList,
  getRepoInfoList,
  getGitHubUserInfo,
  createNewBranch,
  initEmptyRepo,
  getDirInfoList
} from '@/common/api'
import { INIT_REPO_BARNCH } from '@/common/constant'
import {
  goUploadPage,
  persistUserConfigInfo,
  initReHandConfig,
  resetConfig,
  saveUserInfo,
  oneClickAutoConfig
} from '@/views/my-config/my-config.util'

const store = useStore()

const userInfoLoading = ref(false)
const dirLoading = ref(false)
const branchLoading = ref(false)
const refreshBoxWidth = ref(32)

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const logined = computed(() => store.getters.getUserLoginStatus).value
const userSettings = computed(() => store.getters.getUserSettings).value
const reConfig = computed(() => !userConfigInfo.token || !userConfigInfo.owner)
const labelPosition = computed(() => {
  return userSettings.elementPlusSize === ElementPlusSizeEnum.large ? 'right' : 'top'
})
const btnDisabled = computed(() => userInfoLoading.value || dirLoading.value || branchLoading.value)

const newDirInputRef = ref<null | HTMLElement>(null)
const newBranchInputRef = ref<null | HTMLElement>(null)
const newBranchInputVal = ref<string>('')
const repoDirCascaderKey = ref<string>('repoDirCascaderKey')

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
      // eslint-disable-next-line no-case-declarations
      const { dirList } = userConfigInfo
      if (dirList.length) {
        userConfigInfo.selectedDir = dirList[0].value
      } else {
        userConfigInfo.selectedDir = ''
      }
      break

    default:
      userConfigInfo.selectedDir = '/'
      break
  }
  persistUserConfigInfo()
}

async function getRepoList(owner: string) {
  const repoList = await getRepoInfoList(owner)
  console.log('getRepoInfoList >> ', repoList)
  userInfoLoading.value = false
  if (repoList) {
    userConfigInfo.repoList = repoList
    persistUserConfigInfo()
  } else {
    ElMessage.error('仓库信息获取失败，请稍后重试')
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
  persistUserConfigInfo()
}

const branchModeChange = (mode: BranchModeEnum) => {
  const selBranch = userConfigInfo.selectedBranch
  const bv = userConfigInfo.branchList[0].value

  switch (mode) {
    case BranchModeEnum.newBranch:
      userConfigInfo.dirMode = DirModeEnum.newDir
      userConfigInfo.selectedBranch = ''
      userConfigInfo.selectedDir = ''
      newBranchInputRef.value?.focus()
      break

    case BranchModeEnum.repoBranch:
      if (selBranch !== bv) {
        userConfigInfo.selectedBranch = bv
        getDirList()
      }
      break

    default:
      userConfigInfo.selectedBranch = ''
      break
  }
  persistUserConfigInfo()
}

async function getBranchList(repo: string) {
  branchLoading.value = true
  const { owner, dirMode } = userConfigInfo
  const branchInfoList = await getBranchInfoList(owner, repo)
  console.log('getBranchInfoList >> ', branchInfoList)
  branchLoading.value = false
  if (branchInfoList) {
    if (branchInfoList.length > 0) {
      userConfigInfo.branchList = branchInfoList
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
    persistUserConfigInfo()
  } else {
    ElMessage.error('分支信息获取失败，请稍后再试')
  }
}

async function getUserInfo() {
  if (!userConfigInfo.token) {
    ElMessage.error('GitHub Token 不能为空！')
    return
  }

  if (!reConfig.value) {
    initReHandConfig()
  }

  userInfoLoading.value = true
  const userInfo = await getGitHubUserInfo(userConfigInfo.token)
  console.log('getGitHubUserInfo >> ', userInfo)

  if (!userInfo) {
    ElMessage.error('用户信息获取失败，请确认 Token 是否正确')
    return
  }

  saveUserInfo(userInfo)
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
  persistUserConfigInfo()
}

const onNewBranchInputBlur = () => {
  const nb = newBranchInputVal.value
  const list = userConfigInfo.branchList
  if (nb) {
    if (!list.find((x: BranchModel) => x.value === nb)) {
      createNewBranch(userConfigInfo, nb, () => {
        ElMessage.success(`新建 ${nb} 成功`)
        userConfigInfo.branchList.push({ value: nb, label: nb })
      })
    } else {
      ElMessage.warning(`${nb} 分支已存在，请在分支列表中选择`)
    }
  } else {
    ElMessage.error('新建分支不能为空！')
  }
}

watch(
  () => logined,
  (_n) => {
    if (!_n) {
      userInfoLoading.value = false
      dirLoading.value = false
      branchLoading.value = false
    }
  }
)
</script>

<style scoped lang="stylus">
@import "./my-config.styl"
</style>
