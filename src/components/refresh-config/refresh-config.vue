<template>
  <div class="refresh-config-box" :style="{ width: boxWidth + 'rem' }">
    <el-tooltip placement="top" :content="$t('config.reload', { type: $t(dataType) })">
      <el-icon class="icon" @click="reloadData"><IEpRefresh /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { useStore } from '@/stores'
import { getAllRepoList, getBranchInfoList } from '@/common/api'

const instance = getCurrentInstance()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const props = defineProps({
  boxWidth: {
    type: Number,
    default: 20
  },
  dataType: {
    type: String as () => 'repo' | 'branch',
    default: 'repo'
  }
})

const reloadData = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: instance!.proxy!.$t('config.loading4', { type: instance!.proxy!.$t(props.dataType) })
  })

  const { owner, selectedRepo: repo } = userConfigInfo

  if (props.dataType === 'repo') {
    const repoList = await getAllRepoList(owner)
    // eslint-disable-next-line no-unused-expressions
    repoList && (userConfigInfo.repoList = repoList)
  } else if (props.dataType === 'branch') {
    const branchList = await getBranchInfoList(owner, repo)
    if (branchList.length) {
      userConfigInfo.branchList = branchList
    }
  }

  loading.close()
  await store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<style scoped lang="stylus">
@import "./refresh-config.styl"
</style>
