<template>
  <div class="config-page-container">
    <el-form label-width="70px"
             label-position="right"
             class="config-form"
    >
      <el-form-item label="Token">
        <el-input v-model="token"></el-input>
      </el-form-item>

      <el-form-item class="operation-btns">
        <el-button @click="reset()"
        >
          重置
        </el-button>
        <el-button type="primary"
                   @click="getUserInfo()"
        >
          确认Token
        </el-button>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.username"
        label="用户名"
      >
        <el-input v-model="userConfigInfo.username" readonly></el-input>
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

      <el-form-item
        v-if="userConfigInfo.reposList.length"
        label="目录方式"
      >
        <el-radio-group v-model="userConfigInfo.dirMode"
                        @change="dirModeChange"
        >

          <el-tooltip :content="'根据日期自动创建格式 YYYYMMDD 的目录'" placement="top">
            <el-radio label="autoDir">自动目录</el-radio>
          </el-tooltip>
          <el-tooltip content="手动输入一个新目录" placement="top">
            <el-radio label="newDir">新建目录</el-radio>
          </el-tooltip>
          <el-tooltip :content="'选择 ' + userConfigInfo.selectedRepos + ' 仓库下的一个目录'" placement="top">
            <el-radio label="reposDir">选择{{userConfigInfo.selectedRepos }}仓库目录</el-radio>
          </el-tooltip>

        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="userConfigInfo.dirList.length && userConfigInfo.dirMode === 'reposDir'"
        label="选择目录"
      >
        <el-select v-model="userConfigInfo.selectedDir"
                   filterable
                   style="width: 100%"
                   placeholder="请选择目录..."
                   :clearable="true"
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


      <el-form-item style="float: right"
                    v-if="userConfigInfo.selectedRepos"
      >
        <el-button type="success" @click="goUpload">上传图片 Go~</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
  import Axios from "axios";
  import {picx_key} from "../../utils/localStorage";
  import {userConfigInfoModel} from "./model";
  import {mapGetters} from "vuex";
  import cleanObject from "../../utils/cleanObject";
  import timeHelper from "../../utils/timeHelper";

  export default {

    name: "Config",

    data() {
      return {
        token: '',
        userConfigInfo: userConfigInfoModel
      };
    },

    mounted() {
      this.initUserConfigInfo()
    },

    watch: {
      logoutStatus(e) {
        if (e) this.resetUserConfigInfo()
      },

    },

    computed: {
      ...mapGetters({
        logoutStatus: 'getLogoutStatus'
      })
    },

    methods: {

      initUserConfigInfo() {
        let config = localStorage.getItem(picx_key)
        if (config) {
          config = JSON.parse(config)
          this.token = config.token
          for (let configKey in config) {
            this.userConfigInfo[configKey] = config[configKey]
          }
        }

      },

      getUserInfo() {
        if (this.token) {
          Axios.get(
            'https://api.github.com/user',
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `token ${this.token}`
              }
            }
          ).then(res => {
            if (res.status === 200) {
              this.saveUserInfo(res)
              this.getReposList(res.data['repos_url'])
            }
          })
            .catch(err => {
              console.log('err', err);
            })

        } else {
          this.$message.warning('Token 不能为空！')
        }
      },

      saveUserInfo(res) {
        this.userConfigInfo.token = this.token
        this.userConfigInfo.username = res.data['login']
        this.userConfigInfo.nickname = res.data['name']
        this.userConfigInfo.email = res.data['email']
        this.userConfigInfo.avatar_url = res.data['avatar_url']

        this.persistUserConfigInfo()
      },

      getReposList(repos_url) {
        Axios.get(repos_url)
          .then(res => {
            if (res.status === 200) {
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
              this.persistUserConfigInfo()
            }
          })
          .catch(err => {
            console.log('err', err);
          })
      },

      selectRepos(repos) {
        this.persistUserConfigInfo()
        this.getDirList(repos)
      },

      getDirList(repos) {
        Axios.get(`https://api.github.com/repos/${this.userConfigInfo.username}/${repos}/contents`)
          .then(res => {
            if (res.status === 200) {
              this.userConfigInfo.dirList = []
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
          })
          .catch(err => {
            console.log('err', err);
          })

      },

      dirModeChange(dirMode) {

        switch (dirMode) {

          case 'autoDir':
            // 自动目录，根据当天日期自动生成
            this.userConfigInfo.selectedDir = timeHelper.getYYYYMMDD()
            break;

          case 'newDir':
            this.userConfigInfo.selectedDir = ''
            break;

          case 'reposDir':
            break;

        }

        this.persistUserConfigInfo()
      },

      persistUserConfigInfo() {
        this.$store.commit('PERSIST_USER_CONFIG_INFO', this.userConfigInfo)
      },

      reset() {
        this.resetUserConfigInfo()
        this.persistUserConfigInfo()
      },

      resetUserConfigInfo() {
        this.token = ''
        cleanObject(this.userConfigInfo)
      },

      goUpload() {
        if (this.userConfigInfo.selectedDir === '') {

          if (this.userConfigInfo.dirMode === 'autoDir') {

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
  @import "index";
</style>
