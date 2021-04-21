<template>
  <div class="page-container feedback-page-container">
    <el-steps :active="active" finish-status="success" align-center>
      <el-step title="第一步：创建一个GitHub仓库" description="">123</el-step>
      <el-step title="第二步：拿到GitHub的Token">33</el-step>
      <el-step title="第三步：使用">555</el-step>
    </el-steps>
    <div class="cont">
      <Step1 v-if="active === 0"></Step1>
      <Step2 v-if="active === 1"></Step2>
      <Step3 v-if="active === 2"></Step3>
      <div v-if="active === 3">
        <h2>恭喜你完成使用教程！</h2>
      </div>
    </div>
    <div style="text-align: center; padding-top: 20px">
      <el-button type="primary" @click="next(2)">上一步</el-button>
      <el-button type="primary" @click="next(1)">下一步</el-button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

import Step1 from '@/components/Step1.vue'
import Step2 from '@/components/Step2.vue'
import Step3 from '@/components/Step3.vue'

export default defineComponent({
  name: 'About',

  components: {
    Step1,
    Step2,
    Step3
  },
  data() {
    return {
      active: 0
    }
  },
  methods: {
    next(type) {
      if (type === 1) {
        if (this.active === 3) {
          return
        }
        this.active++
        if (this.active === 3) {
          this.$message.success('恭喜你完成配置')
        }
      } else {
        if (this.active === 0) {
          return
        }
        this.active--
      }
    }
  }
})
</script>

<style scoped lang="stylus">

.cont {
  text-align: center;
  padding-top: 30px;
}


.feedback-page-container {

  .help-info-item {
    font-size: 15.8px;
    padding: 6px;
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .description {
    font-weight: bold;
    line-height: 28px;
  }

  .red-text {
    color: #de1a1a;
  }
}
</style>
