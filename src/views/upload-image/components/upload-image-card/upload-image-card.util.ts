import type { UploadImageModel } from '@/common/model'

/**
 * 图片名称添加前缀的处理
 * @param isAddPrefix
 * @param img
 */
export const addPrefixHandle = (isAddPrefix: boolean, img: UploadImageModel) => {
  img.filename.isAddPrefix = isAddPrefix
  if (img.filename.timestamp) {
    // 时间戳命名的图片，名称固定为时间戳，不叠加前缀
    img.filename.name = img.filename.timestamp
  }
  else if (isAddPrefix) {
    img.filename.name = `${img.filename.prefix}${img.filename.initName}`
  }
  else {
    img.filename.name = `${img.filename.initName}`
  }
  if (img.filename.isAddHash) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  }
  else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}

/**
 * 图片名称添加哈希值的处理
 * @param isAddHash
 * @param img
 */
export const addHashHandle = (isAddHash: boolean, img: UploadImageModel) => {
  img.filename.isAddHash = isAddHash
  if (isAddHash) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  }
  else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}

/**
 * 重命名
 * @param isRename
 * @param img
 */
export const rename = (isRename: boolean, img: UploadImageModel) => {
  img.filename.isRename = isRename

  if (isRename) {
    img.filename.name = img.filename.newName.trim().replace(/\s+/g, '-')
  }
  else {
    addPrefixHandle(img.filename.isAddPrefix, img) // 恢复列表 prefix 选项
  }

  if (img.filename.isAddHash) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  }
  else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}
