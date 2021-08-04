<template>
  <div class="page-container tutorials-page-container">
    <el-steps :active="stepNum" finish-status="success" align-center>
      <el-step title="创建 GitHub 仓库"></el-step>
      <el-step title="获取 GitHub Token"></el-step>
      <el-step title="配置图床"></el-step>
    </el-steps>
    <div class="step-content">
      <Step1 v-if="stepNum === 0"></Step1>
      <Step2 v-if="stepNum === 1"></Step2>
      <Step3 v-if="stepNum === 2"></Step3>
      <div v-if="stepNum === 3">
        <h2>👍 恭喜你完成图床使用教程 🌟 快去试试吧~</h2>
        <h2>https://github.com/XPoet/picx</h2>
      </div>
    </div>
    <div class="btn-next-prev">
      <el-button type="primary" @click="step('prev')" v-if="stepNum > 0">上一步 </el-button>
      <el-button type="primary" @click="step('next')" v-if="stepNum < 3">下一步 </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue'
import Step1 from '@/components/tutorials-step/step1.vue'
import Step2 from '@/components/tutorials-step/step2.vue'
import Step3 from '@/components/tutorials-step/step3.vue'

export default defineComponent({
  name: 'tutorials',

  components: {
    Step1,
    Step2,
    Step3
  },

  setup() {
    const stepNum: Ref<number> = ref(0)

    const step = (type: string) => {
      if (type === 'prev') {
        // eslint-disable-next-line no-unused-expressions
        stepNum.value < 0 ? (stepNum.value = 0) : (stepNum.value -= 1)
      }

      if (type === 'next') {
        // eslint-disable-next-line no-unused-expressions
        stepNum.value > 3 ? (stepNum.value = 3) : (stepNum.value += 1)
      }
    }

    return {
      stepNum,
      step
    }
  }
})
</script>

<style scoped lang="stylus">
@import "tutorials.styl"
</style>
