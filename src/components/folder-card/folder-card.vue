<template>
  <div class="folder-card" @dblclick="dblclickFolder">
    <el-tooltip v-if="mode === 'dir'" :content="$t('management.toNextDir')" placement="top">
      <div class="icon">
        <svg
          t="1639999626518"
          class="icon"
          viewBox="0 0 1228 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="3575"
          width="200"
          height="200"
        >
          <path
            d="M1196.987733 212.5824v540.0576c0 39.594667-34.474667 71.3728-76.765866 71.3728H323.242667c-51.780267 0-88.746667-46.762667-73.250134-92.808533l126.737067-375.808H70.417067C31.675733 355.362133 0 326.4512 0 291.089067V98.372267C0 63.044267 31.675733 34.0992 70.417067 34.0992h378.811733c26.7264 0 51.029333 13.9264 63.010133 35.703467l39.048534 71.406933H1120.256c42.257067 0 76.8 32.119467 76.8 71.3728"
            fill="#5398DF"
            p-id="3576"
          ></path>
          <path
            d="M1128.721067 997.853867H68.266667a68.266667 68.266667 0 0 1-68.266667-68.266667V280.3712a68.266667 68.266667 0 0 1 68.266667-68.266667h1060.4544a68.266667 68.266667 0 0 1 68.266666 68.266667V929.5872a68.266667 68.266667 0 0 1-68.266666 68.266667"
            fill="#85BCFF"
            p-id="3577"
          ></path>
        </svg>
      </div>
    </el-tooltip>
    <div class="text" v-if="mode === 'dir'">{{ folderObj.dir }}</div>

    <div class="icon" v-if="mode === 'back'">
      <svg
        t="1640264285200"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="29312"
        width="200"
        height="200"
      >
        <path
          d="M426.666667 384V213.333333l-298.666667 298.666667 298.666667 298.666667v-174.933334c213.333333 0 362.666667 68.266667 469.333333 217.6-42.666667-213.333333-170.666667-426.666667-469.333333-469.333333z"
          p-id="29313"
          fill="#85BCFF"
        ></path>
      </svg>
    </div>
    <div class="text" v-if="mode === 'back'">{{ $t('management.back') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/stores'

const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const props = defineProps({
  folderObj: {
    type: Object,
    default: () => {}
  },
  mode: {
    type: String,
    default: 'dir'
  }
})

const dblclickFolder = () => {
  const { folderObj, mode } = props

  if (mode === 'back') {
    const currentDir = userConfigInfo.viewDir

    if (currentDir === '/') {
      return
    }

    const currentDirList = currentDir.split('/')

    if (currentDirList.length === 1) {
      userConfigInfo.viewDir = '/'
    } else if (currentDirList.length > 1) {
      currentDirList.length -= 1
      userConfigInfo.viewDir = currentDirList.join('/')
    }
  }

  if (mode === 'dir') {
    userConfigInfo.viewDir = folderObj.dirPath
  }

  store.dispatch('USER_CONFIG_INFO_PERSIST')
}
</script>

<style scoped lang="stylus">
@import 'folder-card.styl'
</style>
