<template>
  <div class="selector-wrapper" v-if="getImageCardCheckedNum">
    <div class="selector-left-box">
      <el-checkbox
        :label="allChecked ? '取消全选' : '全选'"
        v-model="allChecked"
        @change="allCheckChange"
      ></el-checkbox>
      <div class="item">已选择 {{ getImageCardCheckedNum }} 张图片</div>
      <div class="item cancel-select-btn" @click="cancelPick">取消选择</div>
    </div>
    <div class="selector-right-box">
      <el-tooltip placement="top" content="批量复制链接">
        <el-icon class="btn-icon" @click="batchCopy"><CopyDocument /></el-icon>
      </el-tooltip>
      <el-tooltip placement="top" content="批量删除图片">
        <el-icon class="btn-icon" @click="batchDeleteImage"><Delete /></el-icon>
      </el-tooltip>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useStore } from '@/store'
import { UploadedImageModel, DeleteStatusEnum } from '@/common/model'
import { batchCopyImageLinks, deleteImageOfGitHub } from '@/utils'

const props = defineProps({
  currentDirImageList: {
    type: Array,
    default: () => []
  }
})

const emits = defineEmits(['update:initImageList'])

const store = useStore()
const allChecked = ref(false)

const getImageCardCheckedArr = computed(() => store.getters.getImageCardCheckedArr)
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const userSettings = computed(() => store.getters.getUserSettings).value
const getImageCardCheckedNum = computed(() => getImageCardCheckedArr.value.length || 0)

watch(
  () => getImageCardCheckedNum.value,
  (newVal) => {
    const newValCheckedNum = props.currentDirImageList.length
    allChecked.value = newVal === newValCheckedNum
  }
)

const batchCopy = () => {
  batchCopyImageLinks(getImageCardCheckedArr.value, userConfigInfo, userSettings)
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
    ElMessageBox.confirm('是否批量删除已选中的图片？', '删除提示', {
      type: 'warning'
    })
      .then(async () => {
        const res = await deleteImageOfGitHub(getImageCardCheckedArr.value, userConfigInfo)
        if (res === DeleteStatusEnum.deleted) {
          ElMessage.success('删除成功！')
        }
        if (res === DeleteStatusEnum.allDeleted) {
          ElMessage.success('批量删除成功！')
        }
        if (res === DeleteStatusEnum.deleteFail) {
          ElMessage.error('删除失败，请稍后重试！')
        }
      })
      .catch(() => {
        console.log('取消批量删除')
      })
  } else {
    ElMessage.warning('请先选择图片')
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
