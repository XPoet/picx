<template>
  <div class="vuex-container page-container">
    <div class="page-title">Vuex Test</div>
    <p>store count is: {{ count }}</p>
    <p>store double is: {{ double }}</p>
    <el-button type="primary" @click="add">add</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, toRefs } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Vuex',

  setup() {
    const store = useStore()

    const reactiveData = reactive({
      count: computed(() => store.state.count),
      double: computed(() => store.getters.double),
    })

    const add = () => {
      store.commit('increment')
    }

    return {
      ...toRefs(reactiveData),
      add
    }

  }
})
</script>

<style scoped lang="stylus">

.vuex-container {

}

</style>
