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
          :placeholder="placeholderI18n()"
        ></el-input>
      </el-form-item>

      <el-form-item class="operation">
        <el-tooltip placement="top" content="自动创建 GitHub 仓库">
          <el-button plain type="primary" @click.prevent="autoConfig()">
            {{ reConfig ? '' : '重新' }}一键自动配置
          </el-button>
        </el-tooltip>
        <el-tooltip placement="top" content="选择现有的 GitHub 仓库">
          <el-button plain type="primary" native-type="submit" @click.prevent="getUserInfo()">
            {{ reConfig ? '' : '重新' }}手动配置
          </el-button>
        </el-tooltip>
      </el-form-item>
    </el-form>

    <!-- 基本信息 -->
    <el-form
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.token && userConfigInfo.owner"
      v-loading="loading"
      :element-loading-text="configPage().loadUser"
    >
      <el-form-item v-if="userConfigInfo.owner" :label="configPage().username">
        <el-input v-model="userConfigInfo.owner" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.email" :label="configPage().email">
        <el-input v-model="userConfigInfo.email" readonly></el-input>
      </el-form-item>

      <!-- 仓库 -->
      <el-form-item v-if="userConfigInfo.repoList.length" :label="configPage().selectRepo">
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
      :element-loading-text="configPage().loadBranch"
    >
      <!-- 由于 GitHub API 目前不支持创建空分支，该功能暂时无法使用 -->
      <el-form-item v-if="userConfigInfo.selectedRepo && 0" :label="configPage().branchType">
        <el-radio-group v-model="userConfigInfo.branchMode" @change="branchModeChange">
          <el-tooltip
            v-if="userConfigInfo.branchList.length"
            :content="configPage().choose + userConfigInfo.selectedRepo + configPage().branchOne"
            placement="top"
          >
            <el-radio label="repoBranch">
              {{ configPage().choose }} {{ userConfigInfo.selectedRepo }}
              {{ configPage().BranchRepo }}
            </el-radio>
          </el-tooltip>
          <el-tooltip :content="configPage().createBranch" placement="top">
            <el-radio label="newBranch"> {{ configPage().newBranch }}</el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <!-- 选择分支 -->
      <el-form-item
        v-if="
          userConfigInfo.branchList.length &&
          userConfigInfo.branchMode === BranchModeEnum.repoBranch
        "
        :label="configPage().chooseBranch"
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
      <el-form-item
        v-if="userConfigInfo.branchMode === BranchModeEnum.newBranch"
        :label="configPage().newBranch"
      >
        <el-input
          v-model="newBranchInputVal"
          @blur="onNewBranchInputBlur"
          clearable
          :placeholder="configPage().mkdirPlease"
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
      :element-loading-text="configPage().loadMsg"
    >
      <el-form-item v-if="userConfigInfo.selectedBranch" :label="configPage().catalog">
        <el-radio-group v-model="userConfigInfo.dirMode" @change="dirModeChange">
          <el-tooltip :content="configPage().toast1" placement="top" :offset="-1">
            <el-radio label="newDir">{{ configPage().mkdir }}</el-radio>
          </el-tooltip>

          <el-tooltip
            :content="configPage().toast2 + userConfigInfo.selectedBranch + configPage().toast3"
            placement="top"
            :offset="-1"
          >
            <el-radio label="rootDir">{{ configPage().root }}</el-radio>
          </el-tooltip>

          <el-tooltip :content="configPage().toast4" placement="top" :offset="-1">
            <el-radio label="autoDir">{{ configPage().automaticDirectory }}</el-radio>
          </el-tooltip>

          <el-tooltip
            v-if="userConfigInfo.dirList.length && userConfigInfo.branchMode !== 'newBranch'"
            :content="configPage().choose + userConfigInfo.selectedBranch + configPage().toast5"
            placement="top"
            :offset="-1"
          >
            <el-radio label="repoDir">
              {{ configPage().choose }} {{ userConfigInfo.selectedRepo }}
              {{ configPage().storageDirectory }}
            </el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'autoDir'" :label="configPage().directory">
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'rootDir'" :label="configPage().root">
        <el-input v-model="userConfigInfo.selectedDir" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.dirMode === 'newDir'" :label="configPage().mkdir">
        <el-input
          ref="newDirInputRef"
          v-model="userConfigInfo.selectedDir"
          @input="persistUserConfigInfo()"
          clearable
          :placeholder="configPage().inNew"
        ></el-input>
      </el-form-item>

      <el-form-item
        v-if="
          userConfigInfo.dirList.length &&
          userConfigInfo.dirMode === 'repoDir' &&
          userConfigInfo.branchMode !== 'newBranch'
        "
        :label="configPage().selectDirectory"
      >
        <repo-dir-cascader :el-key="repoDirCascaderKey" :el-size="userSettings.elementPlusSize" />
      </el-form-item>
    </el-form>

    <!-- 操作（重置、确认配置） -->
    <el-form label-width="70rem" v-if="userConfigInfo.token" :label-position="labelPosition">
      <el-form-item class="operation">
        <el-button plain type="warning" @click="reset()" v-if="userConfigInfo.owner">
          {{ configPage().reset }}
        </el-button>
        <el-button plain type="success" @click="goUpload" v-if="userConfigInfo.selectedRepo">
          {{ configPage().confirm }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { BranchModeEnum, BranchModel, DirModeEnum, ElementPlusSizeEnum } from '@/common/model'
import { formatDatetime } from '@/utils'
import {
  createRepo,
  getBranchInfoList,
  getRepoInfoList,
  getGitHubUserInfo,
  createNewBranch,
  initEmptyRepo,
  getDirInfoList
} from '@/common/api'
import { PICX_REPO_INIT_BARNCH, PICX_REPO_NAME } from '@/common/constant'

const instance = getCurrentInstance()
const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const logined = computed(() => store.getters.getUserLoginStatus).value
const userSettings = computed(() => store.getters.getUserSettings).value
const reConfig = computed(() => !userConfigInfo.token || !userConfigInfo.owner)

const loading = ref(false)
const dirLoading = ref(false)
const branchLoading = ref(false)
const refreshBoxWidth = ref(32)

const labelPosition = computed(() => {
  return userSettings.elementPlusSize === ElementPlusSizeEnum.large ? 'right' : 'top'
})

const newDirInputRef = ref<null | HTMLElement>(null)
const newBranchInputRef = ref<null | HTMLElement>(null)
const newBranchInputVal = ref<string>('')
const repoDirCascaderKey = ref<string>('repoDirCascaderKey')

function persistUserConfigInfo() {
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}

function saveUserInfo(userInfo: any) {
  userConfigInfo.logined = true
  userConfigInfo.owner = userInfo.login
  userConfigInfo.name = userInfo.name
  userConfigInfo.email = userInfo.email
  userConfigInfo.avatarUrl = userInfo.avatar_url
  persistUserConfigInfo()
}

function dirModeChange(dirMode: DirModeEnum) {
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

async function getRepoList(repoUrl: string) {
  const repoList = await getRepoInfoList(repoUrl)
  console.log('getRepoInfoList >> ', repoList)
  loading.value = false
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
      userConfigInfo.selectedBranch = PICX_REPO_INIT_BARNCH
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

  loading.value = true
  const userInfo = await getGitHubUserInfo(userConfigInfo.token)
  console.log('getGitHubUserInfo >> ', userInfo)

  if (!userInfo) {
    ElMessage.error('用户信息获取失败，请确认 Token 是否正确')
    return
  }

  saveUserInfo(userInfo)
  console.log('xx ', userInfo.repos_url)
  await getRepoList(userInfo.repos_url)
}

function selectRepo(repo: string) {
  userConfigInfo.branchList = []
  userConfigInfo.dirList = []
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

function branchModeChange(mode: BranchModeEnum) {
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

function reset() {
  loading.value = false
  dirLoading.value = false
  branchLoading.value = false
  store.dispatch('LOGOUT')
}

async function goUpload() {
  const { selectedDir, dirMode } = userConfigInfo
  let warningMessage: string = '目录不能为空！'

  if (selectedDir === '') {
    switch (dirMode) {
      case DirModeEnum.newDir:
        warningMessage = '请在输入框输入一个新目录！'
        break
      case DirModeEnum.repoDir:
        warningMessage = `请选择 ${userConfigInfo.selectedRepo} 仓库下的一个目录！`
        break
      default:
        warningMessage = '请在输入框输入一个新目录！'
        break
    }
    ElMessage.warning(warningMessage)
  } else {
    await router.push('/upload')
  }
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

const placeholderI18n = () => {
  return instance?.proxy?.$t('imgBedConfig.defaultInput')
}

const configPage = () => {
  return {
    username: instance?.proxy?.$t('username'),
    selectRepo: instance?.proxy?.$t('selectRepo'),
    pleaseSelectRepo: instance?.proxy?.$t('pleaseSelectRepo'),
    reset: instance?.proxy?.$t('reset'),
    confirm: instance?.proxy?.$t('confirm'),
    catalog: instance?.proxy?.$t('catalog'),
    automaticDirectory: instance?.proxy?.$t('automaticDirectory'),
    root: instance?.proxy?.$t('root'),
    choose: instance?.proxy?.$t('choose'),
    storageDirectory: instance?.proxy?.$t('storageDirectory'),
    mkdir: instance?.proxy?.$t('mkdir'),
    selectDirectory: instance?.proxy?.$t('selectDirectory'),
    mkdirPlease: instance?.proxy?.$t('mkdirPlease'),
    directory: instance?.proxy?.$t('directory'),
    toast1: instance?.proxy?.$t('toast1'),
    toast2: instance?.proxy?.$t('toast2'),
    toast3: instance?.proxy?.$t('toast3'),
    toast4: instance?.proxy?.$t('toast4'),
    toast5: instance?.proxy?.$t('toast5'),
    loadUser: instance?.proxy?.$t('loadUser'),
    email: instance?.proxy?.$t('email'),
    loadBranch: instance?.proxy?.$t('loadBranch'),
    branchType: instance?.proxy?.$t('branchType'),
    branchOne: instance?.proxy?.$t('branchOne'),
    BranchRepo: instance?.proxy?.$t('BranchRepo'),
    createBranch: instance?.proxy?.$t('createBranch'),
    newBranch: instance?.proxy?.$t('newBranch'),
    chooseBranch: instance?.proxy?.$t('chooseBranch'),
    pleaseChooseBranch: instance?.proxy?.$t('pleaseChooseBranch'),
    loadMsg: instance?.proxy?.$t('loadMsg'),
    inNew: instance?.proxy?.$t('inNew')
  }

// 一键自动配置图床
const autoConfig = async () => {
  const { token } = userConfigInfo

  if (!token) {
    ElMessage.error('GitHub Token 不能为空！')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在自动配置...'
  })

  const userInfo = await getGitHubUserInfo(userConfigInfo.token)
  console.log('getGitHubUserInfo >> ', userInfo)

  if (!userInfo) {
    loading.close()
    ElMessage.error('用户信息获取失败，请确认 Token 是否正确')
    return
  }

  saveUserInfo(userInfo)

  const repoInfo = await createRepo(userConfigInfo.token)
  console.log('createRepo >> ', repoInfo)

  if (!repoInfo) {
    loading.close()
    ElMessage.error('自动创建 GitHub 仓库失败，请稍后再试！')
    return
  }

  userConfigInfo.repoList = [{ value: PICX_REPO_NAME, label: PICX_REPO_NAME }]
  userConfigInfo.selectedRepo = PICX_REPO_NAME
  userConfigInfo.branchList = [{ value: PICX_REPO_INIT_BARNCH, label: PICX_REPO_INIT_BARNCH }]
  userConfigInfo.selectedBranch = PICX_REPO_INIT_BARNCH
  userConfigInfo.branchMode = BranchModeEnum.repoBranch
  userConfigInfo.selectedDir = formatDatetime('yyyyMMdd')
  userConfigInfo.dirMode = DirModeEnum.autoDir
  persistUserConfigInfo()
  await initEmptyRepo(userConfigInfo, false)
  loading.close()
  ElMessage.success('自动配置成功')
  await router.push('/upload')
}

watch(
  () => logined,
  (_n) => {
    if (!_n) {
      loading.value = false
      dirLoading.value = false
      branchLoading.value = false
    }
  }
)
</script>

<style scoped lang="stylus">
@import "./my-config.styl"
</style>
