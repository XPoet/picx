<template>
  <header class="header">
    <div class="header-left">
      <div class="brand" @click="router.push('/')">
        <div class="logo">
          <img src="../../assets/logo.png" alt="PicX" />
        </div>
        <div class="title">PicX</div>
      </div>
      <div class="website-count">
        <site-count :isuv="false" />
      </div>
    </div>

    <div class="header-right">
      <div class="user-info">
        <div class="username">
          {{ userConfigInfo.owner ? userConfigInfo.owner : $t('header.notLogin') }}
        </div>

        <el-popover
          placement="bottom-end"
          trigger="click"
          width="220rem"
          :show-arrow="false"
          :popper-style="{
            padding: '0'
          }"
        >
          <template #reference>
            <div class="avatar flex-center">
              <img
                :src="userConfigInfo?.avatarUrl"
                v-if="userConfigInfo?.avatarUrl"
                :alt="userConfigInfo?.owner"
              />
              <el-icon :size="22" v-else><IEpUserFilled /></el-icon>
            </div>
          </template>
          <ul class="personal-center-popover">
            <li class="content-item">
              <span class="flex-center">{{ $t('header.language') }}</span>
              <el-select v-model="userSettings.language" size="small" style="width: 100rem">
                <el-option
                  v-for="(lang, idx) in languageOptions"
                  :key="idx + lang.uuid"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
            </li>
            <el-divider style="margin: 5px 0" />
            <li class="content-item" @click="logout">{{ $t('header.logout') }}</li>
          </ul>
        </el-popover>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { getUuid } from '@/utils'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value

const languageOptions = ref([
  {
    uuid: getUuid(),
    label: '中文简体',
    value: 'zh-CN'
  },
  {
    uuid: getUuid(),
    label: '中文繁體',
    value: 'zh-TW'
  },
  {
    uuid: getUuid(),
    label: 'English',
    value: 'en'
  }
])

const logout = () => {
  store.dispatch('LOGOUT')
  router.push('/config')
  document.body.click()
}
</script>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
