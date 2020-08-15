<template>
  <div class="config-page-container">
    <el-form label-width="70px"
             label-position="right"
             class="config-form"
    >
      <el-form-item label="Token" prop="token">
        <el-input v-model="token"></el-input>
      </el-form-item>

      <el-form-item
        v-if="ruleForm.username"
        label="用户名" prop="username">
        <el-input v-model="ruleForm.username" readonly></el-input>
      </el-form-item>

      <el-form-item
        v-if="ruleForm.email"
        label="邮箱" prop="email">
        <el-input v-model="ruleForm.email" readonly></el-input>
      </el-form-item>

      <el-form-item
        v-if="ruleForm.reposList.length"
        label="选择仓库" prop="repository">
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

      <el-form-item class="operation-btns">
        <el-button @click="resetToken('ruleForm')"
        >
          重置
        </el-button>
        <el-button type="primary"
                   @click="getUserInfo()"
        >
          绑定
        </el-button>
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
          reposList: [],
          selectedRepos: ''
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
          this.ruleForm.token = config.token
          this.ruleForm.username = config.username
          this.ruleForm.email = config.email
          this.ruleForm.selectedRepos = config.selectedRepos
          this.ruleForm.reposList = config.reposList
          this.ruleForm.nickname = config.nickname
          this.ruleForm.avatar_url = config.avatar_url
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

      selectRepos() {
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
        this.token = ''
        this.ruleForm.token = ''
        this.ruleForm.username = ''
        this.ruleForm.nickname = ''
        this.ruleForm.email = ''
        this.ruleForm.avatar_url = ''
        this.ruleForm.selectedRepos = ''
        this.ruleForm.reposList = []
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
        float: right;

        .el-button {
          margin-left: 20px;
        }
      }
    }
  }

</style>
