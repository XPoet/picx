import { UploadImageModel, UserSettingsModel } from '@/common/model'
import {
  addWatermarkToImage,
  compressImage,
  getFileSuffix,
  imgFileToBase64,
  isNeedWatermark
} from '@/utils'

/**
 * 图片名称添加前缀的处理
 * @param isAddPrefix
 * @param img
 */
export const addPrefixHandle = (isAddPrefix: boolean, img: UploadImageModel) => {
  img.filename.isAddPrefix = isAddPrefix
  if (isAddPrefix) {
    img.filename.name = `${img.filename.prefix}${img.filename.initName}`
  } else {
    img.filename.name = `${img.filename.initName}`
  }
  if (img.filename.isAddHash) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
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
    addPrefixHandle(img.filename.isAddPrefix, img) // 恢复列表 prefix 选项
  }

  if (img.filename.isAddHash) {
    img.filename.final = `${img.filename.name}.${img.filename.hash}.${img.filename.suffix}`
  } else {
    img.filename.final = `${img.filename.name}.${img.filename.suffix}`
  }
}

/**
 * 初始化图片设置（是否添加水印，是否压缩等）
 * @param imgObj
 * @param userSettings
 */
export const initImgSettings = async (
  imgObj: UploadImageModel,
  userSettings: UserSettingsModel
) => {
  const { watermark, compress } = userSettings
  let file: File = imgObj.fileInfo.originalFile!

  // 添加水印
  if (watermark.enable && watermark.text && !imgObj.fileInfo.watermarkFile) {
    imgObj.beforeUploadStatus.watermarking = true
    imgObj.fileInfo.watermarkFile = isNeedWatermark(imgObj.fileInfo.originalFile!.type)
      ? await addWatermarkToImage(imgObj.fileInfo.originalFile!, watermark)
      : imgObj.fileInfo.originalFile
    file = imgObj.fileInfo.watermarkFile!
    imgObj.base64.watermarkBase64 = await imgFileToBase64(file)
    imgObj.beforeUploadStatus.watermarking = false
  }

  // 压缩图片
  if (compress.enable && !imgObj.fileInfo.compressFile) {
    imgObj.beforeUploadStatus.compressing = true
    imgObj.fileInfo.compressFile = await compressImage(file, compress.encoder)
    file = imgObj.fileInfo.compressFile!
    imgObj.base64.compressBase64 = await imgFileToBase64(file)
    imgObj.filename.suffix = getFileSuffix(file.name)
    imgObj.beforeUploadStatus.compressing = false
  }
}
