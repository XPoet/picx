import type { ImageHandleResult, UploadImageModel, UserSettingsModel } from '@/common/model'
import { getFilename, getFileSuffix } from '@/utils/file-utils'
import { createUploadImageObject } from '@/utils/image-utils'

let lastTimestamp = 0
function nextTimestamp() {
  lastTimestamp = Math.max(Date.now(), lastTimestamp + 1)
  return String(lastTimestamp)
}
export function finalUploadFile(item: UploadImageModel): File | null {
  return item.fileInfo.compressFile ?? item.fileInfo.watermarkFile ?? item.fileInfo.originalFile
}
export function extensionForFile(file: File): string {
  const actual = getFileSuffix(file.name).toLowerCase()
  const extensions: Record<string, string[]> = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/avif': ['avif'], 'image/svg+xml': ['svg'], 'image/gif': ['gif'], 'video/mp4': ['mp4'] }
  const allowed = extensions[file.type]
  return allowed ? (allowed.includes(actual) ? actual : allowed[0]) : actual
}
/** 同一函数负责默认规则、文件覆写与最终产物后缀；不读取 Store。 */
export function applyUploadNaming(item: UploadImageModel, preferences: UserSettingsModel['imageName']) {
  if (item.uploadStatus.progress === 100)
    return
  const override = item.namingOverrides ?? {}
  const filename = item.filename
  const file = finalUploadFile(item)
  if (file)
    filename.suffix = extensionForFile(file)
  filename.prefix = override.prefix ?? preferences.addPrefix.prefix
  filename.isRename = override.isRename ?? false
  filename.newName = override.newName ?? ''
  filename.isAddPrefix = !preferences.enableTimestamp && (override.isAddPrefix ?? preferences.addPrefix.enable)
  filename.isAddHash = !preferences.enableTimestamp && (override.isAddHash ?? preferences.enableHash)
  if (preferences.enableTimestamp) {
    filename.timestamp ||= nextTimestamp()
    filename.name = filename.timestamp
  }
  else {
    const renamed = filename.isRename ? filename.newName.trim().replace(/\s+/g, '-') : ''
    const name = renamed || filename.initName
    filename.name = `${filename.isAddPrefix && !renamed ? filename.prefix : ''}${name}`
  }
  filename.final = `${filename.name}${filename.isAddHash ? `.${filename.hash}` : ''}${filename.suffix ? `.${filename.suffix}` : ''}`
}
export function createNamedUploadImage(input: ImageHandleResult, settings: UserSettingsModel['imageName']): UploadImageModel {
  const item = createUploadImageObject()
  item.uuid = input.uuid
  item.base64.originalBase64 = input.base64
  item.fileInfo.originalFile = input.file
  item.filename.initName = getFilename(input.file.name)
  item.filename.hash = input.uuid
  applyUploadNaming(item, settings)
  return item
}
