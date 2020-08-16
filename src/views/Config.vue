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
        <el-button @click="resetToken()"
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
        v-if="ruleForm.username"
        label="用户名"
      >
        <el-input v-model="ruleForm.username" readonly></el-input>
      </el-form-item>

      <el-form-item
        v-if="ruleForm.email"
        label="邮箱"
      >
        <el-input v-model="ruleForm.email" readonly></el-input>
      </el-form-item>

      <el-form-item
        v-if="ruleForm.reposList.length"
        label="选择仓库"
      >
        <el-select v-model="ruleForm.selectedRepos"
                   filterable
                   style="width: 100%"
                   placeholder="请选择图床仓库..."
                   @change="selectRepos"
        >
          <el-option
            v-for="repos in ruleForm.reposList"
            :key="repos.value"
            :label="repos.label"
            :value="repos.value"
          >
          </el-option>
        </el-select>

      </el-form-item>

      <el-form-item
        label="目录方式"
      >
        <el-radio-group v-model="ruleForm.dirMode"
                        @change="dirModeChange"
        >
          <el-radio label="nonuseDir">不使用目录</el-radio>
          <el-radio label="newDir">新建目录</el-radio>
          <el-radio label="autoDir">自动获取【{{ ruleForm.selectedRepos }}】仓库目录</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="ruleForm.dirList.length && ruleForm.dirMode === 'autoDir'"
        label="选择目录"
      >
        <el-select v-model="ruleForm.selectedDir"
                   filterable
                   style="width: 100%"
                   placeholder="请选择目录..."
                   :clearable="true"
                   @change="selectDir"
        >
          <el-option
            v-for="repos in ruleForm.dirList"
            :key="repos.value"
            :label="repos.label"
            :value="repos.value"
          >
          </el-option>
        </el-select>

      </el-form-item>

      <el-form-item
        v-if="ruleForm.dirMode === 'newDir'"
        label="新建目录"
      >
        <el-input v-model="ruleForm.selectedDir"
                  @input="persistUserInfo()"
                  placeholder="请输入新建的目录..."
        ></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
  import Axios from "axios";
  import {picx_key} from "../utils/localStorage";

  export default {

    name: "Config",

    data() {
      return {
        token: '',
        ruleForm: {
          token: '',
          username: '',
          email: '',
          nickname: '',
          avatar_url: '',
          selectedRepos: '',
          reposList: [],
          dirMode: 'nonuseDir',
          selectedDir: '',
          dirList: []
        },
      };
    },

    mounted() {
      this.initForm()
    },

    methods: {

      initForm() {
        let config = localStorage.getItem(picx_key)
        if (config) {
          config = JSON.parse(config)
          this.token = config.token

          for (let configKey in config) {
            this.ruleForm[configKey] = config[configKey]
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

      getReposList(repos_url) {

        Axios.get(repos_url)
          .then(res => {
            if (res.status === 200) {
              this.ruleForm.reposList = []
              for (const repos of res.data) {
                if (!repos.fork) {
                  this.ruleForm.reposList.push({
                    value: repos.name,
                    label: repos.name,
                    desc: repos.description
                  })
                }
              }
              this.persistUserInfo()
            }
          })
          .catch(err => {
            console.log('err', err);
          })
      },

      selectRepos(repos) {
        this.persistUserInfo()
        this.getDirList(repos)
      },

      getDirList(repos) {
        Axios.get(`https://api.github.com/repos/${this.ruleForm.username}/${repos}/contents`)
          .then(res => {
            if (res.status === 200) {
              this.ruleForm.dirList = []
              for (const item of res.data) {
                if (item.type === 'dir') {
                  this.ruleForm.dirList.push({
                    value: item.name,
                    label: item.name
                  })
                }
              }
              this.persistUserInfo()
            }
          })
          .catch(err => {
            console.log('err', err);
          })

      },


      selectDir() {
        this.persistUserInfo()
      },

      dirModeChange(dirMode) {

        switch (dirMode) {

          case 'nonuseDir':
            this.ruleForm.selectedDir = ''
            break;

          case 'newDir':
            break;

          case 'autoDir':
            break;

        }

        this.persistUserInfo()
      },

      saveUserInfo(res) {
        this.ruleForm.token = this.token
        this.ruleForm.username = res.data['login']
        this.ruleForm.nickname = res.data['name']
        this.ruleForm.email = res.data['email']
        this.ruleForm.avatar_url = res.data['avatar_url']
        this.persistUserInfo()
      },

      persistUserInfo() {
        localStorage.setItem(picx_key, JSON.stringify(this.ruleForm))
      },

      resetToken() {
        for (let ruleFormKey in this.ruleForm) {

          const type = Object.prototype.toString.call(this.ruleForm[ruleFormKey]).split(' ')[1]

          const targetType = type.substring(0, type.length - 1)

          if (targetType === 'String') {
            this.ruleForm[ruleFormKey] = ''
          }

          if (targetType === 'Array') {
            this.ruleForm[ruleFormKey] = []
          }

        }
        this.persistUserInfo()
      },
    }
  }
</script>

<style scoped lang="scss">
  .config-page-container {
    padding: 20px;

    .config-form {

      .operation-btns {
        display: flex;
        justify-content: flex-end;

        .el-button {
          margin-left: 20px;
        }
      }
    }
  }

</style>
