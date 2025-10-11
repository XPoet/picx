import { computed, ref } from 'vue'
import { Props } from '../type'
import { store } from '@/stores'
import { addHashHandle, addPrefixHandle, rename } from '@/utils/video-utils'

export const useFilename = (props: Readonly<Props>) => {
  const renameInputRef = ref<HTMLInputElement | null>(null)

  const userSettings = computed(() => store.getters.getUserSettings).value

  const fileNameOperateData = ref({
    isAddHash: false,
    isAddPrefix: false,
    isRename: false,
    newName: ''
  })

  const onHashRename = (e: boolean) => {
    addHashHandle(props.videoItem.filename, e)
  }

  const onPrefixNaming = (e: boolean) => {
    addPrefixHandle(props.videoItem.filename, e)
  }

  const onRename = () => {
    props.videoItem!.filename.newName = fileNameOperateData.value.newName
    setTimeout(() => {
      renameInputRef.value?.focus()
    }, 100)
    rename(
      props.videoItem!.filename,
      fileNameOperateData.value.isRename,
      fileNameOperateData.value.isAddPrefix
    )
  }

  const initFilename = () => {
    const { imageName } = userSettings
    if (props.videoItem!.uploadStatus.progress === 0) {
      props.videoItem!.filename.isAddHash = imageName.enableHash
      props.videoItem!.filename.isAddPrefix = imageName.addPrefix.enable
      props.videoItem!.filename.prefix = imageName.addPrefix.prefix

      // 添加前缀处理
      addPrefixHandle(props.videoItem.filename, imageName.addPrefix.enable)

      // 添加哈希值处理
      addHashHandle(props.videoItem.filename, imageName.enableHash)

      fileNameOperateData.value.isAddHash = props.videoItem!.filename.isAddHash
      fileNameOperateData.value.isAddPrefix = props.videoItem!.filename.isAddPrefix
      fileNameOperateData.value.isRename = props.videoItem!.filename.isRename
      fileNameOperateData.value.newName = props.videoItem!.filename.newName
    }
  }

  return {
    renameInputRef,
    fileNameOperateData,
    initFilename,
    onHashRename,
    onPrefixNaming,
    onRename
  }
}
