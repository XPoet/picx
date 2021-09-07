<template>
  <div class="selected-info-bar-box" v-if="userConfigInfo.selectedRepos">
    <span class="info-item">
      仓库：<el-tag size="mini">{{ userConfigInfo.selectedRepos }}</el-tag>
    </span>
    <span class="info-item" v-if="userConfigInfo.selectedBranch">
      分支：<el-tag size="mini">{{ userConfigInfo.selectedBranch }}</el-tag>
    </span>
    <span class="info-item" v-if="userConfigInfo.selectedDir">
      目录：
      <el-select
        v-model="userConfigInfo.selectedDir"
        placeholder="请选择"
        size="mini"
        @change="dirChange"
      >
        <el-option
          v-for="(item, index) in userConfigInfo.dirList"
          :key="index"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useStore } from '@/store'

export default defineComponent({
  name: 'selected-info-bar',

  setup(props, context) {
    const store = useStore()
    const userConfigInfo = computed(() => store.getters.getUserConfigInfo)

    const dirChange = (dir: string) => {
      store.dispatch('USER_CONFIG_INFO_PERSIST')
      context.emit('selected-dir-change', dir)
    }

    return {
      userConfigInfo,
      dirChange
    }
  }
})
</script>

<style scoped lang="stylus">
@import "selected-info-bar.styl"
</style>
