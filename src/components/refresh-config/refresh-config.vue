<template>
  <div class="refresh-config-box" :style="{ width: boxWidth + 'rem' }">
    <el-tooltip placement="top" :content="'重新加载 ' + dataTypeName + ' 数据'">
      <el-icon class="icon" @click="reloadData"><Refresh /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/store'
import { getAllRepoList, getBranchInfoList } from '@/common/api'

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const props = defineProps({
  boxWidth: {
    type: Number,
    default: 20
  },
  dataType: {
    type: String,
    default: ''
  }
})

const dataTypeName = computed(() => (props.dataType === 'repo' ? '仓库' : '分支'))

const reloadData = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: `正在加载 ${dataTypeName.value} 数据 ...`
  })

  const { owner, selectedRepo: repo } = userConfigInfo

  if (props.dataType === 'repo') {
    const repoList = await getAllRepoList(owner)
    // eslint-disable-next-line no-unused-expressions
    repoList && (userConfigInfo.repoList = repoList)
  } else if (props.dataType === 'branch') {
    const branchList = await getBranchInfoList(owner, repo)
    // eslint-disable-next-line no-unused-expressions
    branchList && (userConfigInfo.branchList = branchList)
  }

  loading.close()
  await store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<style scoped lang="stylus">
@import "./refresh-config.styl"
</style>
