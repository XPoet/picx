import type { UploadImageModel, UserSettingsModel } from '@/common/model'
import { computed } from 'vue'
import { starredRepo } from '@/common/api'
import { store } from '@/stores'
import { createUploadImageObject } from '@/utils'

const userSettings = computed(() => store.getters.getUserSettings).value

// 上一次生成的时间戳，同一毫秒内连续添加多张图片时递增，保证时间戳命名在批内唯一
let lastTimestamp = 0

const nextTimestamp = () => {
  const now = Date.now()
  lastTimestamp = now > lastTimestamp ? now : lastTimestamp + 1
  return lastTimestamp
}

export const starred = async (userSettings: UserSettingsModel) => {
  const { starred } = userSettings
  if (!starred) {
    const res = await starredRepo()
    if (res) {
      await store.dispatch('SET_USER_SETTINGS', {
        starred: true,
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
  const name = nameHandled.slice(0, tmpIdx)
  const suffix = nameHandled.slice(tmpIdx + 1)

  tmp.filename.initName = name
  tmp.filename.prefix = imageName.addPrefix.prefix
  tmp.filename.hash = hash
  tmp.filename.suffix = suffix

  if (imageName.enableTimestamp) {
    // 时间戳命名：名称替换为时间戳，不与其他命名选项叠加
    tmp.filename.timestamp = `${nextTimestamp()}`
    tmp.filename.name = tmp.filename.timestamp
    tmp.filename.final = `${tmp.filename.name}.${suffix}`
    tmp.filename.isAddHash = false
    tmp.filename.isAddPrefix = false
  }
  else {
    tmp.filename.timestamp = ''
    tmp.filename.name = imageName.addPrefix.enable ? `${imageName.addPrefix.prefix}${name}` : name
    tmp.filename.final = imageName.enableHash
      ? `${tmp.filename.name}.${hash}.${suffix}`
      : `${tmp.filename.name}.${suffix}`
    tmp.filename.isAddHash = imageName.enableHash
    tmp.filename.isAddPrefix = imageName.addPrefix.enable
  }
  return tmp
}
