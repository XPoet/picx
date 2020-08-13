<template>
  <el-form :model="ruleForm"
           :rules="rules"
           ref="ruleForm"
           label-width="100px"
           label-position="right"
           class="demo-ruleForm"
  >
    <el-form-item label="Token" prop="token">
      <el-input v-model="ruleForm.token"></el-input>
    </el-form-item>

    <el-form-item label="用户名" prop="username">
      <el-input v-model="ruleForm.username"></el-input>
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input v-model="ruleForm.email"></el-input>
    </el-form-item>

    <el-form-item label="仓库名" prop="repository">
      <el-input v-model="ruleForm.repository"></el-input>
    </el-form-item>

    <el-form-item label="路径" prop="path">
      <el-input v-model="ruleForm.path"></el-input>
    </el-form-item>

    <el-form-item label="分支" prop="branch">
      <el-input v-model="ruleForm.branch"></el-input>
    </el-form-item>

    <el-form-item>
      <el-button type="primary"
                 @click="submitForm('ruleForm')"
      >
        保存
      </el-button>
      <el-button @click="resetForm('ruleForm')"
      >
        重置
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script>
  export default {
    name: "Config",

    data() {
      return {
        ruleForm: {
          token: '',
          username: '',
          email: '',
          repository: '',
          path: '',
          branch: '',
        },
        rules: {
          token: [
            {required: true, message: 'Token不能为空！', trigger: 'blur'}
          ],
          username: [
            {required: true, message: '用户名不能为空！', trigger: 'blur'}
          ],
          email: [
            {type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change']}
          ],
          repository: [
            {required: true, message: '仓库名不能为空！', trigger: 'blur'}
          ],

        }
      };
    },

    mounted() {

      let config = localStorage.getItem('PICX')
      if (config) {
        config = JSON.parse(config)
        this.ruleForm.token = config.token
        this.ruleForm.username = config.username
        this.ruleForm.email = config.email
        this.ruleForm.repository = config.repository
        this.ruleForm.path = config.path
        this.ruleForm.branch = config.branch
      }

    },

    methods: {
      submitForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            localStorage.setItem('PICX', JSON.stringify(this.ruleForm))
            this.$message.success('保存成功！')
          } else {
            this.$message.error('保存失败，请重新输入！')
            return false;
          }
        });
      },
      resetForm(formName) {
        this.$refs[formName].resetFields();
      }
    }
  }
</script>

<style scoped>

</style>
