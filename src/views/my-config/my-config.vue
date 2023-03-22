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

      <el-form-item class="operation" v-if="!userConfigInfo.owner || !userConfigInfo.token">
        <el-button plain type="primary" @click.prevent="autoConfig()"> 一键自动配置 </el-button>
        <el-button plain type="primary" native-type="submit" @click.prevent="getUserInfo(true)">
          绑定 Token
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 基本信息 -->
    <el-form
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.token && userConfigInfo.owner"
      v-loading="loading"
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
          style="width: 100%"
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
          filterable
          style="width: 100%"
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
        <el-button plain type="warning" @click="reset()" v-if="userConfigInfo.owner">
          重置
        </el-button>
        <el-button plain type="success" @click="goUpload" v-if="userConfigInfo.selectedRepo">
          确认
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
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

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const logined = computed(() => store.getters.getUserLoginStatus).value
const userSettings = computed(() => store.getters.getUserSettings).value

const loading = ref(false)
const dirLoading = ref(false)
const branchLoading = ref(false)

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
    userConfigInfo.repoList = []
    // eslint-disable-next-line no-restricted-syntax
    for (const repo of repoList) {
      if (!repo.fork && !repo.private) {
        userConfigInfo.repoList.push({
          value: repo.name,
          label: repo.name,
          desc: repo.description
        })
      }
    }
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
      // eslint-disable-next-line no-restricted-syntax
      for (const item of branchInfoList) {
        userConfigInfo.branchList.push({
          value: item.name,
          label: item.name
        })
      }
      userConfigInfo.branchList.reverse()
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

async function getUserInfo(isGetRepo: boolean, callback?: any) {
  if (userConfigInfo.token) {
    loading.value = true
    const userInfo = await getGitHubUserInfo(userConfigInfo.token)
    console.log('getGitHubUserInfo >> ', userInfo)
    if (userInfo) {
      saveUserInfo(userInfo)
      // eslint-disable-next-line no-unused-expressions
      isGetRepo && (await getRepoList(userInfo.repos_url))
      // eslint-disable-next-line no-unused-expressions
      callback && callback()
    } else {
      ElMessage.error('用户信息获取失败，请确认 Token 是否正确')
    }
  } else {
    ElMessage.warning('Token 不能为空！')
  }
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

// 一键自动配置图床
const autoConfig = () => {
  getUserInfo(false, async () => {
    const loading = ElLoading.service({
      lock: true,
      text: '正在自动配置...'
    })
    const res = await createRepo(userConfigInfo.token)
    console.log('createRepo >> ', res)
    if (res) {
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
      ElMessage.success('自动配置图床完成')
      await router.push('/upload')
    } else {
      loading.close()
    }
  })
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
