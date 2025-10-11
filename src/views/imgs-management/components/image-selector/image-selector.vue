<template>
  <div class="selector-wrapper" v-if="getCardCheckedNum">
    <div class="selector-left-box">
      <el-checkbox
        :label="allChecked ? $t('management_page.deselectAll') : $t('management_page.selectAll')"
        v-model="allChecked"
        @change="allCheckChange"
      ></el-checkbox>
      <div class="item">
        {{ $t('management_page.selectTotal', { total: getCardCheckedNum }) }}
      </div>
      <div class="item cancel-select-btn" @click="cancelPick">
        {{ $t('management_page.unselect') }}
      </div>
    </div>
    <div class="selector-right-box">
      <el-tooltip
        placement="top"
        :content="$t('management_page.batchCopy')"
        :show-arrow="false"
        :offset="6"
      >
        <el-icon class="btn-icon" @click="batchCopy"><IEpCopyDocument /></el-icon>
      </el-tooltip>
      <el-tooltip
        placement="top"
        :content="$t('management_page.batchDelete')"
        :show-arrow="false"
        :offset="6"
      >
        <el-icon class="btn-icon" @click="batchDeleteImage"><IEpDelete /></el-icon>
      </el-tooltip>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, watch, ref, getCurrentInstance, PropType } from 'vue'
import { useStore } from '@/stores'
import { UploadedImageModel, DeleteStatusEnum, UploadedVideoModel } from '@/common/model'
import {
  copyMessage,
  copyText,
  deleteImageOfGitHub,
  generateImageLink,
  transformImageLink
} from '@/utils'
import { generateVideoLink } from '@/utils/video-utils'

const props = defineProps({
  mediaList: {
    type: Array as PropType<(UploadedImageModel | UploadedVideoModel)[]>,
    default: () => []
  }
})

defineEmits(['updateInitImageList'])

const store = useStore()
const allChecked = ref(false)
const instance = getCurrentInstance()

const getCheckedArr = computed(() => props.mediaList.filter((item) => item.checked))
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const getCardCheckedNum = computed(() => getCheckedArr.value.length || 0)

watch(
  () => getCardCheckedNum.value,
  (newVal) => {
    const newValCheckedNum = props.mediaList.length
    allChecked.value = newVal === newValCheckedNum
  }
)

const batchCopy = () => {
  let linksTxt = ''

  getCheckedArr.value.forEach((item, index) => {
    let link = ''
    if (item.type === 'image') {
      link = transformImageLink(generateImageLink(item), item.name)
    } else if (item.type === 'video') {
      link = generateVideoLink(item) || ''
    }
    linksTxt += `${link}${index < getCheckedArr.value.length - 1 ? '\n' : ''}`
  })

  copyText(linksTxt, () => {
    copyMessage(false)
  })
}

const cancelPick = () => {
  props.mediaList.forEach((item: any) => {
    if (item.checked) {
      item.checked = false
    }
  })
}

const batchDeleteImage = () => {
  if (getCheckedArr.value?.length > 0) {
    ElMessageBox.confirm(
      instance?.proxy?.$t('management_page.delTips2', {
        total: getCheckedArr.value?.length
      }),
      instance?.proxy?.$t('tip'),
      {
        type: 'warning'
      }
    )
      .then(async () => {
        const res = await deleteImageOfGitHub(getCheckedArr.value, userConfigInfo)
        if (res === DeleteStatusEnum.deleted) {
          ElMessage.success({ message: instance?.proxy?.$t('management_page.message5') })
        }
        if (res === DeleteStatusEnum.allDeleted) {
          ElMessage.success({ message: instance?.proxy?.$t('management_page.message6') })
        }
        if (res === DeleteStatusEnum.deleteFail) {
          ElMessage.error({ message: instance?.proxy?.$t('management_page.message7') })
        }
      })
      .catch(() => {
        console.log('Cancel')
      })
  }
}

const allCheckChange = () => {
  const checkedImgArr: Array<UploadedImageModel> = []
  const checkedVideoArr: Array<UploadedVideoModel> = []
  props.mediaList.forEach((item) => {
    item.checked = allChecked.value
    if (item.type === 'video') {
      checkedVideoArr.push(item)
    } else if (item.type === 'image') {
      checkedImgArr.push(item)
    }
  })
  store.commit('REPLACE_IMAGE_CARD', { checkedImgArr })
  store.commit('REPLACE_VIDEO_CARD', { checkedVideoArr })
}

onMounted(() => {
  allCheckChange()
})
</script>

<style scoped lang="stylus">
@import 'image-selector.styl'
</style>
