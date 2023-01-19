<template>
  <div class="selected-info-bar-box" v-if="userConfigInfo.selectedRepos">
    <span class="info-item">
      仓库：
      <el-tag disable-transitions>
        {{ userConfigInfo.selectedRepos }}
      </el-tag>
    </span>
    <span class="info-item" v-if="userConfigInfo.selectedBranch">
      分支：
      <el-tag disable-transitions>
        {{ userConfigInfo.selectedBranch }}
      </el-tag>
    </span>
    <span class="info-item">
      目录：
      <el-tag disable-transitions>
        {{
          barType === 'management' ? userConfigInfo.viewDir : userConfigInfo.selectedDir
        }}
      </el-tag>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/store'

const store = useStore()
const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
const userSettings = computed(() => store.getters.getUserSettings)

defineProps({
  barType: {
    type: String,
    default: 'upload'
  }
})
</script>

<style scoped lang="stylus">
@import "selected-info-bar.styl"
</style>
