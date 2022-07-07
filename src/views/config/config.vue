<template>
  <div class="page-container config-page-container">
    <!-- Token -->
    <el-form label-width="70rem" :label-position="labelPosition" class="config-form">
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
        <el-button
          plain
          type="primary"
          native-type="submit"
          @click.prevent="getUserInfo()"
        >
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
      element-loading-text="加载中..."
    >
      <el-form-item v-if="userConfigInfo.owner" label="用户名">
        <el-input v-model="userConfigInfo.owner" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.email" label="邮箱">
        <el-input v-model="userConfigInfo.email" readonly></el-input>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.reposList.length" label="选择仓库">
        <el-select
          v-model="userConfigInfo.selectedRepos"
          filterable
          style="width: 100%"
          placeholder="请选择图床仓库..."
          @change="selectRepos"
        >
          <el-option
            v-for="(repos, index) in userConfigInfo.reposList"
            :key="index"
            :label="repos.label"
            :value="repos.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 分支 -->
    <el-form
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.selectedRepos && userConfigInfo.branchList.length"
      v-loading="branchLoading"
      element-loading-text="加载中..."
    >
      <!-- 因未验证 API 是否能创建空分支，暂时不开启分支选择方式 && 0 -->
      <el-form-item v-if="userConfigInfo.selectedRepos && 0" label="分支方式">
        <el-radio-group v-model="userConfigInfo.branchMode" @change="branchModeChange">
          <el-tooltip
            v-if="userConfigInfo.branchList.length"
            :content="'选择 ' + userConfigInfo.selectedRepos + ' 仓库下的一个分支'"
            placement="top"
          >
            <el-radio label="reposBranch">
              选择 {{ userConfigInfo.selectedRepos }} 仓库下的分支
            </el-radio>
          </el-tooltip>
          <el-tooltip content="手动创建一个新分支" placement="top">
            <el-radio label="newBranch">新建分支</el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="
          userConfigInfo.branchList.length > 1 &&
          userConfigInfo.branchMode === 'reposBranch'
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
            v-for="(repos, reposIndex) in userConfigInfo.branchList"
            :key="reposIndex"
            :label="repos.label"
            :value="repos.value"
          >
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item v-if="userConfigInfo.branchMode === 'newBranch'" label="新建分支">
        <el-input
          v-model="userConfigInfo.selectedBranch"
          @input="persistUserConfigInfo()"
          clearable
          placeholder="请输入新建的分支..."
        ></el-input>
      </el-form-item>
    </el-form>

    <!-- 目录 -->
    <el-form
      label-width="70rem"
      :label-position="labelPosition"
      v-if="userConfigInfo.selectedBranch"
      v-loading="dirLoading"
      element-loading-text="加载中..."
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
            v-if="
              userConfigInfo.dirList.length && userConfigInfo.branchMode !== 'newBranch'
            "
            :content="'选择 ' + userConfigInfo.selectedBranch + ' 分支下的一个目录'"
            placement="top"
            :offset="-1"
          >
            <el-radio label="reposDir">
              选择 {{ userConfigInfo.selectedRepos }} 仓库目录
            </el-radio>
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
          v-model="userConfigInfo.selectedDir"
          @input="persistUserConfigInfo()"
          clearable
          placeholder="请输入新建的目录..."
        ></el-input>
      </el-form-item>

      <el-form-item
        v-if="
          userConfigInfo.dirList.length &&
          userConfigInfo.dirMode === 'reposDir' &&
          userConfigInfo.branchMode !== 'newBranch'
        "
        label="选择目录"
      >
        <el-cascader
          style="width: 100%"
          :props="cascaderProps"
          :key="elCascaderKey"
          v-model="userConfigInfo.selectedDirList"
          filterable
          placeholder="请选择一个目录..."
          clearable
          @change="cascaderChange"
        />
      </el-form-item>
    </el-form>

    <!-- 操作（重置、完成配置） -->
    <el-form label-width="70rem" :label-position="labelPosition">
      <el-form-item class="operation">
        <el-button plain type="warning" @click="reset()" v-if="userConfigInfo.owner">
          重置
        </el-button>
        <el-button
          plain
          type="success"
          @click="goUpload"
          v-if="userConfigInfo.selectedRepos"
        >
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
import { DirModeEnum } from '@/common/model/dir.model'
import { BranchModeEnum } from '@/common/model/user-config-info.model'
import axios from '@/utils/axios'
import TimeHelper from '@/utils/time-helper'
import { getDirListByPath } from '@/common/api'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const loggingStatus = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value

const loading = ref(false)
const dirLoading = ref(false)
const branchLoading = ref(false)

const labelPosition = computed(() => {
  return userSettings.elementPlusSize === 'large' ? 'right' : 'top'
})

const elCascaderKey = ref<string>('elCascaderKey')

function persistUserConfigInfo() {
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}

function saveUserInfo(res: any) {
  userConfigInfo.loggingStatus = true
  userConfigInfo.owner = res.data.login
  userConfigInfo.name = res.data.name
  userConfigInfo.email = res.data.email
  userConfigInfo.avatarUrl = res.data.avatar_url
  persistUserConfigInfo()
}

function getReposList(reposUrl: string) {
  axios
    .get(reposUrl, {
      params: {
        type: 'public',
        sort: 'created',
        per_page: 100
      }
    })
    .then((res: any) => {
      console.log('[getReposList] ', res)
      if (res.status === 200 && res.data.length > 0) {
        userConfigInfo.reposList = []
        // eslint-disable-next-line no-restricted-syntax
        for (const repos of res.data) {
          if (!repos.fork && !repos.private) {
            userConfigInfo.reposList.push({
              value: repos.name,
              label: repos.name,
              desc: repos.description
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
      userConfigInfo.selectedDir = TimeHelper.getYyyyMmDd()
      break

    case DirModeEnum.newDir:
      // 手动输入的新建目录
      userConfigInfo.selectedDir = 'xxx'
      break

    case DirModeEnum.reposDir:
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

function getBranchList(repos: string) {
  branchLoading.value = true
  axios.get(`/repos/${userConfigInfo.owner}/${repos}/branches`).then((res: any) => {
    console.log('[getBranchList] ', res)
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
        userConfigInfo.branchList.reverse()
        userConfigInfo.selectedBranch = userConfigInfo.branchList[0].value
        userConfigInfo.branchMode = BranchModeEnum.reposBranch
        getDirList()
      } else {
        userConfigInfo.selectedBranch = 'master'
        userConfigInfo.branchMode = BranchModeEnum.newBranch
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
        console.log('[getUserInfo] ', res)
        if (res && res.status === 200) {
          saveUserInfo(res)
          getReposList(res.data.repos_url)
        } else {
          loading.value = false
        }
      })
  } else {
    ElMessage.warning('Token 不能为空！')
  }
}

function selectRepos(repos: string) {
  userConfigInfo.branchList = []
  userConfigInfo.dirList = []
  getBranchList(repos)
  persistUserConfigInfo()
}

async function selectBranch(branch: string) {
  userConfigInfo.selectedBranch = branch
  await getDirList()
  elCascaderKey.value = userConfigInfo.selectedBranch
  userConfigInfo.selectedDir = userConfigInfo.dirList[0].value
  userConfigInfo.selectedDirList = [userConfigInfo.selectedDir]
  persistUserConfigInfo()
}

function branchModeChange(mode: BranchModeEnum) {
  const selBranch = userConfigInfo.selectedBranch
  const bv = userConfigInfo.branchList[0].value

  switch (mode) {
    case BranchModeEnum.newBranch:
      userConfigInfo.selectedBranch = 'xxx'
      userConfigInfo.dirMode = DirModeEnum.newDir
      userConfigInfo.selectedDir = 'xxx'
      break

    case BranchModeEnum.reposBranch:
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
  store.dispatch('LOGOUT')
}

function goUpload() {
  const { selectedDir, dirMode } = userConfigInfo
  let warningMessage: string = '目录不能为空！'

  if (selectedDir === '') {
    switch (dirMode) {
      case DirModeEnum.newDir:
        warningMessage = '请在输入框输入一个新目录！'
        break
      case DirModeEnum.reposDir:
        warningMessage = `请选择 ${userConfigInfo.selectedRepos} 仓库下的一个目录！`
        break
      default:
        warningMessage = '请在输入框输入一个新目录！'
        break
    }
    ElMessage.warning(warningMessage)
  } else {
    router.push('/upload')
  }
}

const cascaderProps = {
  lazy: true,
  checkStrictly: true,
  async lazyLoad(node: any, resolve: any) {
    const { level, pathLabels } = node
    let dirs: any
    if (level === 0) {
      dirs = userConfigInfo.dirList
    } else {
      dirs = await getDirListByPath(pathLabels.join('/'))
    }
    if (dirs) {
      resolve(
        dirs.map((x: any) => ({
          value: x.value,
          label: x.label,
          leaf: level >= 2
        }))
      )
    } else {
      resolve([])
    }
  }
}

function cascaderChange(e: string[]) {
  userConfigInfo.selectedDirList = e
  userConfigInfo.selectedDir = e.join('/')
  persistUserConfigInfo()
}

watch(
  () => loggingStatus,
  (_n) => {
    if (!_n) {
      loading.value = false
      dirLoading.value = false
    }
  }
)
</script>

<style scoped lang="stylus">
@import "config.styl"
</style>
