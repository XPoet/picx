<template>
  <div class="page-container config-page-container">
    <el-form label-width="70px"
             label-position="right"
             class="config-form"
    >
      <el-form-item label="Token">
        <el-input v-model="userConfigInfo.token" :clearable="true"></el-input>
      </el-form-item>

      <el-form-item class="operation">
        <el-button plain
                   @click="reset()"
        >
          重置
        </el-button>
        <el-button plain
                   type="primary"
                   @click="getUserInfo()"
        >
          确认Token
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 基本信息 -->
    <el-form label-width="70px"
             label-position="right"
             v-if="userConfigInfo.token"
             v-loading="loading"
             element-loading-text="加载中..."
    >

      <el-form-item
        v-if="userConfigInfo.owner"
        label="用户名"
      >
        <el-input v-model="userConfigInfo.owner" readonly></el-input>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.email"
        label="邮箱"
      >
        <el-input v-model="userConfigInfo.email" readonly></el-input>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.reposList.length"
        label="选择仓库"
      >
        <el-select v-model="userConfigInfo.selectedRepos"
                   filterable
                   style="width: 100%"
                   placeholder="请选择图床仓库..."
                   @change="selectRepos"
        >
          <el-option
            v-for="(repos, index) in userConfigInfo.reposList"
            :key="index + '_' + repos.value"
            :label="repos.label"
            :value="repos.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 目录 -->
    <el-form label-width="70px"
             label-position="right"
             v-if="userConfigInfo.selectedRepos"
             v-loading="dirLoading"
             element-loading-text="加载中..."
    >
      <el-form-item
        v-if="userConfigInfo.reposList.length && userConfigInfo.selectedRepos"
        label="目录方式"
      >
        <el-radio-group v-model="userConfigInfo.dirMode"
                        @change="dirModeChange"
        >
          <el-tooltip content="手动输入一个新目录" placement="top">
            <el-radio label="newDir">新建目录</el-radio>
          </el-tooltip>

          <el-tooltip :content="'图片存储在 ' + userConfigInfo.selectedBranch + ' 分支的根目录下'" placement="top">
            <el-radio label="rootDir">根目录</el-radio>
          </el-tooltip>

          <el-tooltip :content="'根据日期自动创建格式 YYYYMMDD 的目录'" placement="top">
            <el-radio label="autoDir">自动目录</el-radio>
          </el-tooltip>

          <el-tooltip v-if="userConfigInfo.dirList.length"
                      :content="'选择 ' + userConfigInfo.selectedRepos + ' 仓库下的一个目录'" placement="top">
            <el-radio label="reposDir">选择{{ userConfigInfo.selectedRepos }}仓库目录</el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.dirMode === 'autoDir'"
        label="自动目录"
      >
        <el-input v-model="userConfigInfo.selectedDir"
                  readonly
        ></el-input>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.dirMode === 'rootDir'"
        label="根目录"
      >
        <el-input v-model="userConfigInfo.selectedDir"
                  readonly
        ></el-input>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.dirMode === 'newDir'"
        label="新建目录"
      >
        <el-input v-model="userConfigInfo.selectedDir"
                  @input="persistUserConfigInfo()"
                  clearable
                  placeholder="请输入新建的目录..."
        ></el-input>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.dirList.length && userConfigInfo.dirMode === 'reposDir'"
        label="选择目录"
      >
        <el-select v-model="userConfigInfo.selectedDir"
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

      <el-form-item class="operation"
                    v-if="userConfigInfo.selectedRepos"
      >
        <el-button plain type="success" @click="goUpload">上传图片</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {defineComponent, reactive, computed, toRefs, watch} from 'vue'
import {useRouter} from "vue-router";
import {useStore} from "vuex";
import axios from '../utils/axios/index'
import {ElMessage} from 'element-plus'
import timeHelper from "../common/utils/timeHelper";

export default defineComponent({
  name: 'Config',

  setup(props, context) {
    const router = useRouter()
    const store = useStore()

    const selectRepos = (repos) => {
      reactiveData.innerSelectRepos(repos)
    }

    const dirModeChange = (dirMode) => {
      reactiveData.innerDirModeChange(dirMode)
    }

    const goUpload = () => {
      reactiveData.innerGoUpload()
    }

    const reactiveData = reactive({

      userConfigInfo: computed(() => store.getters.getUserConfigInfo),
      loggingStatus: computed(() => store.getters.getUserConfigInfo),

      loading: false,
      dirLoading: false,

      getUserInfo() {
        if (this.userConfigInfo.token) {
          this.loading = true
          axios.get(
            '/user',
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `token ${this.userConfigInfo.token}`
              }
            }
          ).then(res => {
            if (res) {
              this.saveUserInfo(res)
              this.getReposList(res['repos_url'])
            } else {
              this.loading = false
            }
          }).catch(err => {
            this.loading = false
            console.log('err: ', err);
          })

        } else {
          ElMessage.warning('Token不能为空！')
        }
      },

      saveUserInfo(res) {
        this.userConfigInfo.loggingStatus = true
        this.userConfigInfo.owner = res['login']
        this.userConfigInfo.name = res['name']
        this.userConfigInfo.email = res['email']
        this.userConfigInfo.avatarUrl = res['avatar_url']
        this.persistUserConfigInfo()
      },

      getReposList(repos_url) {
        axios.get(
          repos_url,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            }
          }
        ).then(res => {
          if (res && res.length) {
            this.userConfigInfo.reposList = []
            for (const repos of res) {
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

      innerSelectRepos(repos) {
        reactiveData.persistUserConfigInfo()
        reactiveData.getBranchList(repos)
      },

      getBranchList(repos) {
        axios.get(
          `https://api.github.com/repos/${this.userConfigInfo.owner}/${repos}/branches`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            }
          }
        ).then(res => {
          if (res) {

            const MASTER = 'master'
            const MAIN = 'main'

            if (res.length) {
              if (res.some(v => v.name === MASTER)) {
                this.userConfigInfo.selectedBranch = MASTER
              } else if (res.some(v => v.name === MAIN)) {
                this.userConfigInfo.selectedBranch = MAIN
              }
              this.getDirList(repos)
            } else {
              this.userConfigInfo.selectedBranch = MASTER
            }
          }
        })
      },

      getDirList(repos) {
        this.dirLoading = true
        axios.get(
          `https://api.github.com/repos/${this.userConfigInfo.owner}/${repos}/contents`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            }
          }
        ).then(res => {

          if (res && res.length) {
            this.userConfigInfo.dirList = [{value: '/', label: '/'}]
            for (const item of res) {
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

      innerDirModeChange(dirMode) {
        switch (dirMode) {

          case 'rootDir':
            this.userConfigInfo.selectedDir = '/'
            break;

          case 'autoDir':
            // 自动目录，根据当天日期自动生成
            this.userConfigInfo.selectedDir = timeHelper.getYYYYMMDD()
            break;

          case 'newDir':
            this.userConfigInfo.selectedDir = ''
            break;

          case 'reposDir':
            this.userConfigInfo.selectedDir = ''
            break;

        }
        this.persistUserConfigInfo()
      },

      persistUserConfigInfo() {
        store.commit('PERSIST_USER_CONFIG_INFO')
      },

      reset() {
        this.loading = false
        this.dirLoading = false
        store.dispatch('LOGOUT')
      },

      innerGoUpload() {
        const dir = this.userConfigInfo.selectedDir
        const dirMode = this.userConfigInfo.dirMode
        let warningMessage = '目录不能为空！'

        if (!dir) {
          switch (dirMode) {
            case 'newDir':
              warningMessage = '请在输入框输入一个新目录！'
              break
            case 'reposDir':
              warningMessage = `请选择 ${this.userConfigInfo.selectedRepos} 仓库下的一个目录！`
              break
          }
          ElMessage.warning(warningMessage)
          return
        }

        router.push('/upload')
      }

    })

    watch(() => reactiveData.loggingStatus, (_n, _o) => {
      if (!_n) {
        reactiveData.loading = false
        reactiveData.dirLoading = false
      }
    })

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

.config-page-container {

  .operation {
    text-align right

    .el-button {
      margin-left 20px

      &:first-child {
        margin-left 0
      }
    }
  }
}

</style>
