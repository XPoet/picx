<template>
  <div class="selector-wrapper" v-if="getImageCardCheckedNum">
    <div class="selector-left-box">
      <el-checkbox
        :label="allChecked ? $t('management_page.deselectAll') : $t('management_page.selectAll')"
        v-model="allChecked"
        @change="allCheckChange"
      ></el-checkbox>
      <div class="item">
        {{ $t('management_page.selectTotal', { total: getImageCardCheckedNum }) }}
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
import { computed, onMounted, watch, ref, getCurrentInstance } from 'vue'
import { useStore } from '@/stores'
import { UploadedImageModel, DeleteStatusEnum } from '@/common/model'
import { batchCopyImageLinks, deleteImageOfGitHub } from '@/utils'

const props = defineProps({
  currentDirImageList: {
    type: Array,
    default: () => []
  }
})

defineEmits(['updateInitImageList'])

const store = useStore()
const allChecked = ref(false)
const instance = getCurrentInstance()

const getImageCardCheckedArr = computed(() => store.getters.getImageCardCheckedArr)
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const getImageCardCheckedNum = computed(() => getImageCardCheckedArr.value.length || 0)

watch(
  () => getImageCardCheckedNum.value,
  (newVal) => {
    const newValCheckedNum = props.currentDirImageList.length
    allChecked.value = newVal === newValCheckedNum
  }
)

const batchCopy = () => {
  batchCopyImageLinks(getImageCardCheckedArr.value)
}

const cancelPick = () => {
  props.currentDirImageList.forEach((item: any) => {
    if (item.checked) {
      item.checked = false
    }
  })
}

const batchDeleteImage = () => {
  if (getImageCardCheckedArr.value?.length > 0) {
    ElMessageBox.confirm(
      instance?.proxy?.$t('management_page.delTips2', {
        total: getImageCardCheckedArr.value?.length
      }),
      instance?.proxy?.$t('tip'),
      {
        type: 'warning'
      }
    )
      .then(async () => {
        const res = await deleteImageOfGitHub(getImageCardCheckedArr.value, userConfigInfo)
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
  let checkedImgArr: Array<UploadedImageModel> = []
  props.currentDirImageList.forEach((item: any) => {
    item.checked = allChecked.value
  })
  checkedImgArr = props.currentDirImageList as any
  store.commit('REPLACE_IMAGE_CARD', { checkedImgArr })
}

onMounted(() => {
  allCheckChange()
})
</script>

<style scoped lang="stylus">
@import 'image-selector.styl'
</style>
