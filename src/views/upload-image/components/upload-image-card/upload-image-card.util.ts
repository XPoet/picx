import { UploadImageModel, UserSettingsModel } from '@/common/model'
import { addWatermarkToImage, compressImage, imgFileToBase64 } from '@/utils'

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
    imgObj.fileInfo.watermarkFile = await addWatermarkToImage(
      imgObj.fileInfo.originalFile!,
      watermark
    )
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
    imgObj.beforeUploadStatus.compressing = false
  }
}
