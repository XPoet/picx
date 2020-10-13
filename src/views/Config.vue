<template>
  <div class="page-container config-page-container">
    <el-form label-width="70px"
             label-position="right"
             class="config-form"
    >
      <el-form-item label="Token">
        <el-input v-model="userConfigInfo.token"></el-input>
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
            v-for="repos in userConfigInfo.reposList"
            :key="repos.value"
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

          <el-tooltip :content="'图片存储在 Master 分支的根目录下'" placement="top">
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

      <el-form-item style="float: right"
                    v-if="userConfigInfo.selectedRepos"
      >
        <el-button plain type="success" @click="goUpload">上传图片</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import timeHelper from "../common/utils/timeHelper";

export default {

  name: "Config",

  data() {
    return {
      loading: false,
      dirLoading: false,
    }
  },

  mounted() {

  },

  watch: {
    loggingStatus(e) {
      if (!e) {
        this.loading = false
        this.dirLoading = false
      }
    }
  },

  computed: {
    ...mapGetters({
      userConfigInfo: 'getUserConfigInfo',
      loggingStatus: 'getUserLoggingStatus',
    })
  },

  methods: {
    getUserInfo() {
      if (this.userConfigInfo.token) {
        this.loading = true
        this.$axios.get(
          '/user',
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `token ${this.userConfigInfo.token}`
            }
          }
        ).then(res => {
          if (res && res.status === 200) {
            this.saveUserInfo(res)
            this.getReposList(res.data['repos_url'])
          }
        })

      } else {
        this.$message.warning('Token不能为空！')
      }
    },

    saveUserInfo(res) {
      this.userConfigInfo.loggingStatus = true
      this.userConfigInfo.owner = res.data['login']
      this.userConfigInfo.name = res.data['name']
      this.userConfigInfo.email = res.data['email']
      this.userConfigInfo.avatarUrl = res.data['avatar_url']
      this.persistUserConfigInfo()
    },

    getReposList(repos_url) {
      this.$axios.get(
        repos_url,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${this.userConfigInfo.token}`
          }
        }
      ).then(res => {
        if (res.status === 200 && res.data.length) {
          this.userConfigInfo.reposList = []
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

    selectRepos(repos) {
      this.persistUserConfigInfo()
      this.getBranchList(repos)
    },

    getBranchList(repos) {
      this.$axios.get(
        `https://api.github.com/repos/${this.userConfigInfo.owner}/${repos}/branches`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${this.userConfigInfo.token}`
          }
        }
      ).then(res => {

        if (res.status === 200) {

          const MASTER = 'master'
          const MAIN = 'main'

          if (res.data.length) {
            if (res.data.some(v => v.name === MASTER)) {
              this.userConfigInfo.selectedBranch = MASTER
            } else if (res.data.some(v => v.name === MAIN)) {
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
      this.$axios.get(
        `https://api.github.com/repos/${this.userConfigInfo.owner}/${repos}/contents`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${this.userConfigInfo.token}`
          }
        }
      ).then(res => {

        if (res.status === 200 && res.data.length) {
          this.userConfigInfo.dirList = [{value: '/', label: '/'}]
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

    dirModeChange(dirMode) {
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
      this.$store.commit('PERSIST_USER_CONFIG_INFO')
    },

    reset() {
      this.loading = false
      this.dirLoading = false
      this.$store.dispatch('LOGOUT')
    },

    goUpload() {
      if (this.userConfigInfo.selectedDir === '') {

        if (this.userConfigInfo.dirMode === 'reposDir') {

          this.$message.warning(`请选择 ${this.userConfigInfo.selectedRepos} 仓库下的一个目录！`)

        } else if (this.userConfigInfo.dirMode === 'newDir') {

          this.$message.warning(`请在输入框输入一个新目录！`)

        } else {
          this.$router.push('/')
        }
      } else {
        this.$router.push('/')
      }

    }

  }
}
</script>

<style scoped lang="scss">
.config-page-container {
  overflow-y: auto;

  .config-form {

    .operation {
      display: flex;
      justify-content: flex-end;

      .el-button {
        margin-left: 20px;
      }
    }
  }
}
</style>
