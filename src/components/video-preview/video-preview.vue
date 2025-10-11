<script lang="ts" setup>
import { ref } from 'vue'

type Data = { url: string; name: string }

const dialogVisible = ref(false)

const videoData = ref<Data>({
  url: '',
  name: ''
})

const handleOpen = (item: Data) => {
  dialogVisible.value = true
  videoData.value = item
}

defineExpose({
  handleOpen
})
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="videoData.name" width="800">
    <video v-if="videoData.url" :src="videoData.url" controls autoplay class="video"></video>
  </el-dialog>
</template>

<style scoped lang="stylus">
.video {
  width 100%
  height 100%
  max-height 60vh
  background #000
}
</style>
