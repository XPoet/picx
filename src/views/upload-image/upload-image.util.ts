import { computed } from 'vue'
import { Md5 } from 'ts-md5'
import { UploadImageModel, UserSettingsModel } from '@/common/model'
import { starredRepo } from '@/common/api'
import { store } from '@/stores'
import { createUploadImageObject } from '@/utils'

const userSettings = computed(() => store.getters.getUserSettings).value

export const starred = async (userSettings: UserSettingsModel) => {
  const { starred } = userSettings
  if (!starred) {
    const res = await starredRepo()
    if (res) {
      await store.dispatch('SET_USER_SETTINGS', {
        starred: true
      })
    }
  }
}

export const generateUploadImageObject = (obj: {
  uuid: string
  file: File
  base64: string
}): UploadImageModel => {
  const tmp: UploadImageModel = createUploadImageObject()
  tmp.uuid = obj.uuid
  tmp.base64.originalBase64 = obj.base64
  tmp.fileInfo.originalFile = obj.file

  const { imageName } = userSettings

  const hash = obj.uuid

  // 处理文件名，去除空格字符
  const nameHandled = obj.file.name.trim().replaceAll(' ', '-')

  const tmpIdx = nameHandled.lastIndexOf('.')
  let name = nameHandled.slice(0, tmpIdx)
  name = imageName.enableMD5 ? Md5.hashStr(name) : name
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
