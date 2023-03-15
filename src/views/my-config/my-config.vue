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
        <el-button plain type="primary" native-type="submit" @click.prevent="getUserInfo()">
          确认 Token
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 基本信息 -->
    <el-form
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.token"
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
      v-if="userConfigInfo.selectedRepo && userConfigInfo.branchList.length"
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
          userConfigInfo.branchList.length > 1 &&
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
      v-if="userConfigInfo.selectedBranch"
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

    <!-- 操作（重置、完成配置） -->
    <el-form label-width="70rem" :label-position="labelPosition">
      <el-form-item class="operation">
        <el-button plain type="warning" @click="reset()" v-if="userConfigInfo.owner">
          重置
        </el-button>
        <el-button plain type="success" @click="goUpload" v-if="userConfigInfo.selectedRepo">
          完成配置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { DirModeEnum, BranchModeEnum, BranchModel } from '@/common/model'
import axios from '@/utils/axios'
import { formatDatetime, initBranch, initRepo } from '@/utils'
import { getDirListByPath } from '@/common/api'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const logined = computed(() => store.getters.getUserLoginStatus).value
const userSettings = computed(() => store.getters.getUserSettings).value

const loading = ref(false)
const dirLoading = ref(false)
const branchLoading = ref(false)

const labelPosition = computed(() => {
  return userSettings.elementPlusSize === 'large' ? 'right' : 'top'
})

const repoDirCascaderKey = ref<string>('repoDirCascaderKey')

const newDirInputRef = ref<null | HTMLElement>(null)
const newBranchInputRef = ref<null | HTMLElement>(null)
const newBranchInputVal = ref<string>('')

function persistUserConfigInfo() {
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}

function saveUserInfo(res: any) {
  userConfigInfo.logined = true
  userConfigInfo.owner = res.data.login
  userConfigInfo.name = res.data.name
  userConfigInfo.email = res.data.email
  userConfigInfo.avatarUrl = res.data.avatar_url
  persistUserConfigInfo()
}

function getRepoList(repoUrl: string) {
  axios
    .get(repoUrl, {
      params: {
        type: 'public',
        sort: 'created',
        per_page: 100
      }
    })
    .then((res: any) => {
      console.log('getRepoList >> ', res)
      if (res.status === 200 && res.data.length > 0) {
        userConfigInfo.repoList = []
        // eslint-disable-next-line no-restricted-syntax
        for (const repo of res.data) {
          if (!repo.fork && !repo.private) {
            userConfigInfo.repoList.push({
              value: repo.name,
              label: repo.name,
              desc: repo.description
            })
          }
        }
        loading.value = false
        persistUserConfigInfo()
      }
    })
}

async function getDirList() {
  dirLoading.value = true
  userConfigInfo.dirList = await getDirListByPath()
  persistUserConfigInfo()
  dirLoading.value = false
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

function getBranchList(repo: string) {
  branchLoading.value = true
  axios.get(`/repos/${userConfigInfo.owner}/${repo}/branches`).then(async (res: any) => {
    console.log('getBranchList >> ', res)
    if (res && res.status === 200) {
      branchLoading.value = false
      if (res.data.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const item of res.data) {
          userConfigInfo.branchList.push({
            value: item.name,
            label: item.name
          })
        }
        // userConfigInfo.branchList.reverse()
        userConfigInfo.selectedBranch = userConfigInfo.branchList[0].value
        userConfigInfo.branchMode = BranchModeEnum.repoBranch
        await getDirList()
      } else {
        userConfigInfo.selectedBranch = 'master'
        userConfigInfo.branchMode = BranchModeEnum.newBranch

        // 当分支列表为空时，判定该仓库为空仓库，需要初始化
        await initRepo(userConfigInfo)
      }
      dirModeChange(userConfigInfo.dirMode)
      persistUserConfigInfo()
    }
  })
}

function getUserInfo() {
  if (userConfigInfo.token) {
    loading.value = true
    axios
      .get('/user', {
        headers: { Authorization: `token ${userConfigInfo.token}` }
      })
      .then((res: any) => {
        console.log('getUserInfo >> ', res)
        if (res && res.status === 200) {
          saveUserInfo(res)
          getRepoList(res.data.repos_url)
        } else {
          loading.value = false
        }
      })
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
      initBranch(userConfigInfo, nb, () => {
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
