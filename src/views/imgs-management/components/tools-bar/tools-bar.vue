<script setup lang="ts">
import { computed } from 'vue'
import { ImageSortEnum } from '@/common/model'
import { store } from '@/stores'

const emits = defineEmits(['reload'])

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const sortMode = computed(() => store.getters.getUserSettings.management.sort)

const sortOptions: Array<{ value: ImageSortEnum, labelKey: string }> = [
  { value: ImageSortEnum.default, labelKey: 'management_page.sortDefault' },
  { value: ImageSortEnum.nameAsc, labelKey: 'management_page.sortNameAsc' },
  { value: ImageSortEnum.nameDesc, labelKey: 'management_page.sortNameDesc' },
  { value: ImageSortEnum.timeDesc, labelKey: 'management_page.sortTimeDesc' },
]

const onSortCommand = (command: ImageSortEnum) => {
  if (command === sortMode.value) {
    return
  }
  store.dispatch('SET_USER_SETTINGS', { management: { sort: command } })
}

const onBack = () => {
  const currentDir = userConfigInfo.viewDir

  if (currentDir === '/') {
    return
  }

  const currentDirList = currentDir.split('/')

  if (currentDirList.length === 1) {
    userConfigInfo.viewDir = '/'
  }
  else if (currentDirList.length > 1) {
    currentDirList.length -= 1
    userConfigInfo.viewDir = currentDirList.join('/')
  }
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<template>
  <div class="tools-bar border-box">
    <div class="left flex-start">
      <el-button text circle :disabled="userConfigInfo.viewDir === '/'" @click="onBack">
        <el-icon :size="18">
          <IEpArrowLeftBold />
        </el-icon>
      </el-button>

      <div class="dir-info flex-start">
        <el-icon><IEpFolder /></el-icon>
        {{ userConfigInfo.viewDir.split('/').join(' / ') }}
      </div>
    </div>
    <div class="right flex-end">
      <el-dropdown
        class="sort-dropdown"
        trigger="click"
        placement="bottom-end"
        @command="onSortCommand"
      >
        <el-icon
          class="btn-icon"
          :class="{ 'is-active': sortMode !== ImageSortEnum.default }"
          :aria-label="$t('management_page.sort')"
        >
          <IEpSort />
        </el-icon>
        <template #dropdown>
          <el-dropdown-menu class="sort-dropdown-menu">
            <el-dropdown-item
              v-for="option in sortOptions"
              :key="option.value"
              :command="option.value"
            >
              <span class="sort-check-holder">
                <el-icon v-if="option.value === sortMode">
                  <IEpCheck />
                </el-icon>
              </span>
              {{ $t(option.labelKey) }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <copy-source-repo position="management" />
      <el-tooltip
        placement="top"
        :content="$t('management_page.reload')"
        :show-arrow="false"
        :offset="6"
      >
        <el-icon class="btn-icon" @click.stop="emits('reload')">
          <IEpRefresh />
        </el-icon>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import "tools-bar.styl"
</style>

<style lang="stylus">
// 排序下拉菜单挂在 body 下（teleport），scoped 样式无法作用，需全局样式
.sort-dropdown-menu {
  .sort-check-holder {
    display inline-flex
    width 16rem
    margin-right 6rem
  }
}
</style>
