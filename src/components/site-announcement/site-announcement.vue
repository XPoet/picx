<template>
  <el-button
    class="site-announcement-btn border-box"
    :class="{
      dot: userSettings.showAnnouncement
    }"
    circle
    text
    @click="dialogVisible = true"
  >
    <el-icon :size="22">
      <IEpBell />
    </el-icon>
  </el-button>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('header.announcement.text_1')"
    width="500"
    :modal="false"
    draggable
    @close="onClose"
  >
    <div class="announcement-item">
      {{ $t('header.announcement.text_2') }}
    </div>
    <div class="announcement-item">
      {{ $t('header.announcement.text_3') }}
      <el-link type="primary" target="_blank" href="https://v2.picx.xpoet.cn"> PicX v2.0 </el-link>
    </div>
    <template #footer>
      <el-button @click="notRemindAgain"> {{ $t('header.announcement.text_4') }} </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { store } from '@/stores'

const dialogVisible = ref(false)
const globalSettings = computed(() => store.getters.getGlobalSettings).value
const userSettings = computed(() => store.getters.getUserSettings).value

const onClose = () => {
  store.dispatch('SET_GLOBAL_SETTINGS', {
    showAnnouncement: false
  })
}

const notRemindAgain = () => {
  dialogVisible.value = false
  store.dispatch('SET_USER_SETTINGS', {
    showAnnouncement: false
  })
}

onMounted(() => {
  if (globalSettings.showAnnouncement && userSettings.showAnnouncement) {
    dialogVisible.value = true
  }
})
</script>

<style scoped lang="stylus">
@import "./site-announcement.styl"
</style>
