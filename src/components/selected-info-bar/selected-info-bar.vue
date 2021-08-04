<template>
  <div class="selected-info-bar-box" v-if="userConfigInfo.selectedRepos">
    <span class="info-item">
      仓库：<el-tag size="mini">{{ userConfigInfo.selectedRepos }}</el-tag>
    </span>
    <span class="info-item" v-if="userConfigInfo.selectedBranch">
      分支：<el-tag size="mini">{{ userConfigInfo.selectedBranch }}</el-tag>
    </span>
    <span class="info-item" v-if="userConfigInfo.selectedDir">
      目录：<el-tag size="mini">{{ userConfigInfo.selectedDir }}</el-tag>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, toRefs } from 'vue'
import { useStore } from '@/store'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'

export default defineComponent({
  name: 'selected-info-bar',

  setup() {
    const store = useStore()

    const reactiveData = reactive({
      userConfigInfo: computed((): UserConfigInfoModel => store.getters.getUserConfigInfo)
    })

    return {
      ...toRefs(reactiveData)
    }
  }
})
</script>

<style scoped lang="stylus">
@import "selected-info-bar.styl"
</style>
