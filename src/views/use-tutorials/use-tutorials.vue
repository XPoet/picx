<template>
  <div class="page-container tutorials-page-container">
    <el-steps :active="stepNum" finish-status="success" align-center>
      <el-step :title="tips().tip1"></el-step>
      <el-step :title="tips().tip2"></el-step>
      <el-step :title="tips().tip3"></el-step>
    </el-steps>
    <div class="step-content">
      <Step1 v-if="stepNum === 0"></Step1>
      <Step2 v-if="stepNum === 1"></Step2>
      <Step3 v-if="stepNum === 2"></Step3>
      <div v-if="stepNum === 3">
        <h2>👍 {{ $t('useCourse.step3.title') }} 🌟 {{ $t('useCourse.step3.title2') }}~</h2>
        <h2>https://github.com/XPoet/picx</h2>
      </div>
    </div>
    <div class="btn-next-prev">
      <el-button type="primary" @click="step('prev')" v-if="stepNum > 0"
        >{{ $t('useCourse.lastStep') }}
      </el-button>
      <el-button type="primary" @click="step('next')" v-if="stepNum < 3"
        >{{ $t('useCourse.nextStep') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, getCurrentInstance } from 'vue'
import Step1 from './components/tutorials-step1.vue'
import Step2 from './components/tutorials-step2.vue'
import Step3 from './components/tutorials-step3.vue'

export default defineComponent({
  name: 'use-tutorials',

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
    const instance = getCurrentInstance()
    const tips = () => {
      return {
        tip1: instance?.proxy?.$t('useCourse.step1.tip'),
        tip2: instance?.proxy?.$t('useCourse.step2.tip'),
        tip3: instance?.proxy?.$t('useCourse.step3.tip')
      }
    }

    return {
      stepNum,
      step,
      tips
    }
  }
})
</script>

<style scoped lang="stylus">
@import "use-tutorials.styl"
</style>
