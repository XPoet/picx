<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { store } from '@/stores'

const dialogVisible = ref(false)
const globalSettings = computed(() => store.getters.getGlobalSettings).value
const userSettings = computed(() => store.getters.getUserSettings).value

const onClose = () => {
  store.dispatch('SET_GLOBAL_SETTINGS', {
    showAnnouncement: false,
  })
}

const notRemindAgain = () => {
  dialogVisible.value = false
  store.dispatch('SET_USER_SETTINGS', {
    showAnnouncement: false,
  })
}

onMounted(() => {
  if (globalSettings.showAnnouncement && userSettings.showAnnouncement) {
    dialogVisible.value = true
  }
})
</script>

<template>
  <el-button
    class="site-announcement-btn border-box"
    :class="{
      dot: userSettings.showAnnouncement,
    }"
    :aria-label="$t('header.announcement.text_1')"
    :title="$t('header.announcement.text_1')"
    circle
    text
    @click="dialogVisible = true"
  >
    <PicxIcon name="bell" />
  </el-button>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('header.announcement.text_1')"
    width="min(500px, calc(100vw - 32px))"
    :modal="false"
    draggable
    @close="onClose"
  >
    <div class="announcement-item">
      <el-link
        type="primary"
        target="_blank"
        href="https://picx.xpoet.cn"
      >
        {{ $t('header.announcement.text_2') }}
      </el-link>
    </div>
    <template #footer>
      <el-button @click="notRemindAgain">
        {{ $t('header.announcement.text_3') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="stylus">
@import "./site-announcement.styl"
</style>
