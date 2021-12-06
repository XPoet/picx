<template>
  <div class="page-container config-page-container">
    <!-- Token -->
    <el-form label-width="70px" label-position="right" class="config-form">
      <el-form-item label="Token">
        <el-input
          v-model="userConfigInfo.token"
          clearable
          :autofocus="!userConfigInfo.token"
        ></el-input>
      </el-form-item>

      <el-form-item class="operation">
        <el-button
          plain
          size="small"
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
      label-width="70px"
      label-position="right"
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
      label-width="70px"
      label-position="right"
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
      label-width="70px"
      label-position="right"
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
        <el-select
          v-model="userConfigInfo.selectedDir"
          filterable
          style="width: 100%"
          placeholder="请选择目录..."
          @change="persistUserConfigInfo"
        >
          <el-option
            v-for="repos in userConfigInfo.dirList"
            :key="repos.value"
            :label="repos.label"
            :value="repos.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 操作 -->
    <el-form label-width="70px">
      <el-form-item class="operation">
        <el-button
          plain
          size="small"
          type="warning"
          @click="reset()"
          v-if="userConfigInfo.owner"
        >
          重置
        </el-button>
        <el-button
          plain
          size="small"
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

<script lang="ts">
import { defineComponent, reactive, computed, toRefs, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStore } from '@/store'
import { DirModeEnum } from '@/common/model/dir.model'
import { BranchModeEnum, UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import axios from '@/common/utils/axios'
import TimeHelper from '@/common/utils/time-helper'

export default defineComponent({
  name: 'config',

  setup() {
    const router = useRouter()
    const store = useStore()

    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo)
        .value,
      loggingStatus: computed(() => store.getters.getUserConfigInfo).value,

      loading: false,
      dirLoading: false,
      branchLoading: false,

      getUserInfo() {
        if (this.userConfigInfo.token) {
          this.loading = true
          axios.defaults.headers.Authorization = `token ${this.userConfigInfo.token}`
          axios.get('/user').then((res: any) => {
            console.log('[getUserInfo] ', res)
            if (res && res.status === 200) {
              this.saveUserInfo(res)
              this.getReposList(res.data.repos_url)
            } else {
              this.loading = false
            }
          })
        } else {
          ElMessage.warning('Token 不能为空！')
        }
      },

      saveUserInfo(res: any) {
        this.userConfigInfo.loggingStatus = true
        this.userConfigInfo.owner = res.data.login
        this.userConfigInfo.name = res.data.name
        this.userConfigInfo.email = res.data.email
        this.userConfigInfo.avatarUrl = res.data.avatar_url
        this.persistUserConfigInfo()
      },

      getReposList(reposUrl: string) {
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
              this.userConfigInfo.reposList = []
              // eslint-disable-next-line no-restricted-syntax
              for (const repos of res.data) {
                if (!repos.fork && !repos.private) {
                  this.userConfigInfo.reposList.push({
                    value: repos.name,
                    label: repos.name,
                    desc: repos.description
                  })
                }
              }
              this.loading = false
              this.persistUserConfigInfo()
            }
          })
      },

      innerSelectRepos(repos: string) {
        this.userConfigInfo.branchList = []
        this.userConfigInfo.dirList = []
        reactiveData.getBranchList(repos)
        reactiveData.persistUserConfigInfo()
      },

      getBranchList(repos: string) {
        this.branchLoading = true
        axios
          .get(`/repos/${this.userConfigInfo.owner}/${repos}/branches`)
          .then((res: any) => {
            console.log('[getBranchList] ', res)
            if (res && res.status === 200) {
              this.branchLoading = false
              if (res.data.length > 0) {
                // eslint-disable-next-line no-restricted-syntax
                for (const item of res.data) {
                  this.userConfigInfo.branchList.push({
                    value: item.name,
                    label: item.name
                  })
                }
                this.userConfigInfo.selectedBranch =
                  this.userConfigInfo.branchList[0].value
                this.userConfigInfo.branchMode = BranchModeEnum.reposBranch
                this.getDirList(this.userConfigInfo.selectedBranch)
              } else {
                this.userConfigInfo.selectedBranch = 'master'
                this.userConfigInfo.branchMode = BranchModeEnum.newBranch
              }
              this.innerDirModeChange(this.userConfigInfo.dirMode)
              this.persistUserConfigInfo()
            }
          })
      },

      innerSelectBranch(branch: string) {
        reactiveData.getDirList(branch)
        reactiveData.persistUserConfigInfo()
      },

      getDirList(branch: string) {
        this.dirLoading = true
        axios
          .get(
            `/repos/${this.userConfigInfo.owner}/${this.userConfigInfo.selectedRepos}/contents`,
            {
              params: {
                ref: branch
              }
            }
          )
          .then((res: any) => {
            console.log('[getDirList] ', res)
            if (res && res.status === 200 && res.data.length > 0) {
              this.userConfigInfo.dirList = [{ value: '/', label: '/' }]
              // eslint-disable-next-line no-restricted-syntax
              for (const item of res.data) {
                if (item.type === 'dir') {
                  this.userConfigInfo.dirList.push({
                    value: item.name,
                    label: item.name
                  })
                }
              }
              this.persistUserConfigInfo()
            }
            this.dirLoading = false
          })
      },

      innerBranchModeChange(mode: BranchModeEnum) {
        const selBranch = this.userConfigInfo.selectedBranch
        const bv = this.userConfigInfo.branchList[0].value

        switch (mode) {
          case BranchModeEnum.newBranch:
            this.userConfigInfo.selectedBranch = 'xxx'
            this.userConfigInfo.dirMode = DirModeEnum.newDir
            this.userConfigInfo.selectedDir = 'xxx'
            break

          case BranchModeEnum.reposBranch:
            if (selBranch !== bv) {
              this.userConfigInfo.selectedBranch = bv
              this.getDirList(bv)
            }
            break

          default:
            this.userConfigInfo.selectedBranch = ''
            break
        }
        this.persistUserConfigInfo()
      },

      innerDirModeChange(dirMode: DirModeEnum) {
        switch (dirMode) {
          case DirModeEnum.rootDir:
            // 根目录
            this.userConfigInfo.selectedDir = '/'
            break

          case DirModeEnum.autoDir:
            // 自动目录，根据当天日期自动生成
            this.userConfigInfo.selectedDir = TimeHelper.getYyyyMmDd()
            break

          case DirModeEnum.newDir:
            // 手动输入的新建目录
            this.userConfigInfo.selectedDir = 'xxx'
            break

          case DirModeEnum.reposDir:
            // 仓库目录
            // eslint-disable-next-line no-case-declarations
            const { dirList } = this.userConfigInfo
            if (dirList.length) {
              this.userConfigInfo.selectedDir = dirList[0].value
            } else {
              this.userConfigInfo.selectedDir = ''
            }
            break

          default:
            this.userConfigInfo.selectedDir = '/'
            break
        }
        this.persistUserConfigInfo()
      },

      persistUserConfigInfo() {
        store.dispatch('USER_CONFIG_INFO_PERSIST')
      },

      reset() {
        this.loading = false
        this.dirLoading = false
        store.dispatch('LOGOUT')
      },

      innerGoUpload() {
        const { selectedDir, dirMode } = this.userConfigInfo
        let warningMessage: string = '目录不能为空！'

        if (selectedDir === '') {
          switch (dirMode) {
            case DirModeEnum.newDir:
              warningMessage = '请在输入框输入一个新目录！'
              break
            case DirModeEnum.reposDir:
              warningMessage = `请选择 ${this.userConfigInfo.selectedRepos} 仓库下的一个目录！`
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
    })

    const selectRepos = (repos: string) => {
      reactiveData.innerSelectRepos(repos)
    }

    const selectBranch = (branch: string) => {
      reactiveData.innerSelectBranch(branch)
    }

    const dirModeChange = (mode: DirModeEnum) => {
      reactiveData.innerDirModeChange(mode)
    }

    const branchModeChange = (mode: BranchModeEnum) => {
      reactiveData.innerBranchModeChange(mode)
    }

    const goUpload = () => {
      reactiveData.innerGoUpload()
    }

    const createBranch = () => {
      // axios
      //   .get(
      //     `/repos/${reactiveData.userConfigInfo.owner}/${reactiveData.userConfigInfo.selectedRepos}/git/refs/heads`
      //   )
      //   .then((res: any) => {
      //     console.log('[git/refs/heads] ', res)
      //     if (res && res.status === 200) {
      //     }
      //   })
      // axios
      //   .post(
      //     `/repos/${reactiveData.userConfigInfo.owner}/${reactiveData.userConfigInfo.selectedRepos}/git/refs`,
      //     {
      //       ref: `refs/heads/${reactiveData.userConfigInfo.selectedBranch}`,
      //       sha: '6b74f243e6396757c1bc7aec85e57424286db33a'
      //     }
      //   )
      //   .then((res: any) => {
      //     console.log('[/git/refs] ', res)
      //     if (res && res.status === 201) {
      //     }
      //   })
    }

    watch(
      () => reactiveData.loggingStatus,
      (_n) => {
        if (!_n) {
          reactiveData.loading = false
          reactiveData.dirLoading = false
        }
      }
    )

    return {
      ...toRefs(reactiveData),
      branchModeChange,
      dirModeChange,
      selectRepos,
      selectBranch,
      createBranch,
      goUpload
    }
  }
})
</script>

<style scoped lang="stylus">
@import "config.styl"
</style>
