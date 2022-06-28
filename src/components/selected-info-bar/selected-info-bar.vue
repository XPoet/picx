<template>
  <div class="selected-info-bar-box" v-if="userConfigInfo.selectedRepos">
    <span class="info-item">
      仓库：
      <el-tag>
        {{ userConfigInfo.selectedRepos }}
      </el-tag>
    </span>
    <span class="info-item" v-if="userConfigInfo.selectedBranch">
      分支：
      <el-tag>
        {{ userConfigInfo.selectedBranch }}
      </el-tag>
    </span>
    <span class="info-item" v-if="userConfigInfo.selectedDir">
      目录：
      <el-tag>
        {{ userConfigInfo.selectedDir }}
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
</script>

<style scoped lang="stylus">
@import "selected-info-bar.styl"
</style>
