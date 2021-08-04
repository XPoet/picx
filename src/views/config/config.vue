<template>
  <div class="page-container config-page-container">
    <!-- Token -->
    <el-form label-width="70px" label-position="right" class="config-form">
      <el-form-item label="Token">
        <el-input v-model="userConfigInfo.token" clearable :autofocus="!userConfigInfo.token"></el-input>
      </el-form-item>

      <el-form-item class="operation">
        <el-button plain size="small" type="primary" native-type="submit" @click="getUserInfo()">
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

    <!-- 目录 -->
    <el-form
      label-width="70px"
      label-position="right"
      v-if="userConfigInfo.selectedRepos"
      v-loading="dirLoading"
      element-loading-text="加载中..."
    >
      <el-form-item v-if="userConfigInfo.reposList.length && userConfigInfo.selectedRepos" label="目录方式">
        <el-radio-group v-model="userConfigInfo.dirMode" @change="dirModeChange">
          <el-tooltip content="手动输入一个新目录" placement="top">
            <el-radio label="newDir">新建目录</el-radio>
          </el-tooltip>

          <el-tooltip :content="'图片存储在 ' + userConfigInfo.selectedBranch + ' 分支的根目录下'" placement="top">
            <el-radio label="rootDir">根目录</el-radio>
          </el-tooltip>

          <el-tooltip :content="'根据日期自动创建格式 YYYYMMDD 的目录'" placement="top">
            <el-radio label="autoDir">自动目录</el-radio>
          </el-tooltip>

          <el-tooltip
            v-if="userConfigInfo.dirList.length"
            :content="'选择 ' + userConfigInfo.selectedRepos + ' 仓库下的一个目录'"
            placement="top"
          >
            <el-radio label="reposDir">选择 {{ userConfigInfo.selectedRepos }} 仓库目录</el-radio>
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

      <el-form-item v-if="userConfigInfo.dirList.length && userConfigInfo.dirMode === 'reposDir'" label="选择目录">
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
        <el-button plain size="small" @click="reset()" v-if="userConfigInfo.owner"> 重置 </el-button>
        <el-button plain size="small" type="success" @click="goUpload" v-if="userConfigInfo.selectedRepos"
          >完成配置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, toRefs, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { ElMessage } from 'element-plus'
import { DirModeEnum } from '@/common/model/dir.model'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import axios from '@/common/utils/axios'
import TimeHelper from '@/common/utils/timeHelper'

export default defineComponent({
  name: 'config',

  setup() {
    const router = useRouter()
    const store = useStore()

    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo).value,
      loggingStatus: computed(() => store.getters.getUserConfigInfo).value,

      loading: false,
      dirLoading: false,

      getUserInfo() {
        if (this.userConfigInfo.token) {
          this.loading = true
          axios
            .get('/user', {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `token ${this.userConfigInfo.token}`
              }
            })
            .then((res: any) => {
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
            headers: {
              'Content-Type': 'application/json',
              Authorization: `token ${this.userConfigInfo.token}`
            }
          })
          .then((res: any) => {
            if (res.status === 200 && res.data.length > 0) {
              this.userConfigInfo.reposList = []
              // eslint-disable-next-line no-restricted-syntax
              for (const repos of res.data) {
                if (!repos.fork) {
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
        reactiveData.getBranchList(repos)
        reactiveData.persistUserConfigInfo()
      },

      getBranchList(repos: string) {
        this.dirLoading = true
        axios
          .get(`/repos/${this.userConfigInfo.owner}/${repos}/branches`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `token ${this.userConfigInfo.token}`
            }
          })
          .then((res: any) => {
            if (res && res.status === 200) {
              this.dirLoading = false
              const MASTER = 'master'
              const MAIN = 'main'

              if (res.data.length > 0) {
                if (res.data.some((v: any) => v.name === MASTER)) {
                  this.userConfigInfo.selectedBranch = MASTER
                } else if (res.data.some((v: any) => v.name === MAIN)) {
                  this.userConfigInfo.selectedBranch = MAIN
                }
                this.getDirList(repos)
              } else {
                this.userConfigInfo.selectedBranch = MASTER
                this.userConfigInfo.dirMode = DirModeEnum.newDir
                this.userConfigInfo.selectedDir = ''
                this.userConfigInfo.dirList = []
              }
            }
          })
      },

      getDirList(repos: string) {
        this.dirLoading = true
        axios
          .get(`/repos/${this.userConfigInfo.owner}/${repos}/contents`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `token ${this.userConfigInfo.token}`
            }
          })
          .then((res: any) => {
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
            this.userConfigInfo.selectedDir = ''
            break

          case DirModeEnum.reposDir:
            // 仓库目录
            this.userConfigInfo.selectedDir = ''
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

    const dirModeChange = (dirMode: DirModeEnum) => {
      reactiveData.innerDirModeChange(dirMode)
    }

    const goUpload = () => {
      reactiveData.innerGoUpload()
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
      dirModeChange,
      selectRepos,
      goUpload
    }
  }
})
</script>

<style scoped lang="stylus">
@import "config.styl"
</style>
