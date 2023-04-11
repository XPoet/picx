import { UploadImageModel } from '@/common/model'

/**
 * 前缀命名
 * @param isPrefix
 * @param img
 */
export const prefixNamingTrans = (isPrefix: boolean, img: UploadImageModel) => {
  if (isPrefix) {
    img.filename.name = `${img.filename.prefixName}${img.filename.initName}`
  } else {
    img.filename.name = `${img.filename.initName}`
  }
  if (img.filename.isHashRename) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}

/**
 * 命名哈希化
 * @param isHash
 * @param img
 */
export const hashRename = (isHash: boolean, img: UploadImageModel) => {
  if (isHash) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
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
  } else {
    prefixNamingTrans(img.filename.isPrefix, img) // 恢复列表 prefix 选项
  }

  if (img.filename.isHashRename) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}
