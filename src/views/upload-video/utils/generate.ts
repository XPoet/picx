import { computed } from 'vue'
import { VideoHandleResult, UploadVideoModel } from '@/common/model'
import { store } from '@/stores'
import { createUploadVideoObject } from '@/utils/video-utils'

const userSettings = computed(() => store.getters.getUserSettings).value
export const generateUploadVideoObject = (obj: VideoHandleResult): UploadVideoModel => {
  const tmp: UploadVideoModel = createUploadVideoObject()
  tmp.uuid = obj.uuid
  tmp.base64.originalBase64 = obj.base64
  tmp.fileInfo.originalFile = obj.file
  tmp.objectURL = obj.objectURL

  const { imageName } = userSettings

  const hash = obj.uuid

  // 处理文件名，去除空格字符
  const nameHandled = obj.file.name.trim().replaceAll(' ', '-')

  const tmpIdx = nameHandled.lastIndexOf('.')
  const name = nameHandled.slice(0, tmpIdx)
  const suffix = nameHandled.slice(tmpIdx + 1)

  tmp.filename.initName = name
  tmp.filename.name = imageName.addPrefix.enable ? `${imageName.addPrefix.prefix}${name}` : name
  tmp.filename.prefix = imageName.addPrefix.prefix
  tmp.filename.hash = hash
  tmp.filename.suffix = suffix
  tmp.filename.final = imageName.enableHash
    ? `${tmp.filename.name}.${hash}.${suffix}`
    : `${tmp.filename.name}.${suffix}`
  tmp.filename.isAddHash = imageName.enableHash
  tmp.filename.isAddPrefix = imageName.addPrefix.enable
  return tmp
}
