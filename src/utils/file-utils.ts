import { ElMessage } from 'element-plus'
import { ImageHandleResult } from '@/common/model'
import { getUuid } from '@/utils/common-utils'
import { imgFileToBase64 } from '@/utils/image-utils'
import { IMG_UPLOAD_MAX_SIZE } from '@/common/constant'

/**
 * 获取文件名
 * @param filename
 */
export const getFilename = (filename: string) => {
  const splitIndex = filename.indexOf('.')
  return filename.substr(0, splitIndex).trim().replace(/\s+/g, '-')
}

/**
 * 获取文件名后缀格式
 * @param filename
 */
export const getFileSuffix = (filename: string) => {
  const idx = filename.lastIndexOf('.')
  return filename.slice(idx + 1)
}

/**
 * 判断文件类型是否为图片格式
 * @param fileType
 */
export const isImage = (fileType: string): boolean => {
  return /(png|jpg|jpeg|gif|webp|awebp|avif|svg\+xml|svg|x-icon|vnd.microsoft.icon)$/.test(fileType)
}

/**
 * 判断是否需要压缩的图片格式
 * @param imageType
 */
export const isNeedCompress = (imageType: string): boolean => {
  return /(png|jpg|jpeg|webp|avif)$/.test(imageType)
}

/**
 * 判断是否需要添加水印的图片格式
 * @param imageType
 */
export const isNeedWatermark = (imageType: string): boolean => {
  return /(png|jpg|jpeg|webp|avif)$/.test(imageType)
}

/**
 * 获取文件大小 (KB)
 * @param size
 */
export const getFileSize = (size: number) => {
  if (size) {
    return Number((size / 1024).toFixed(0))
  }
  return size
}

/**
 * 处理获取的图片文件
 * @param file
 */
export const gettingFilesHandle = (file: File): Promise<ImageHandleResult | null> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    if (!file) {
      resolve(null)
    }

    if (!isImage(file.type)) {
      ElMessage.error(`${file.name} 不是图片格式`)
      resolve(null)
    }

    const base64 = (await imgFileToBase64(file)) || ''

    if (getFileSize(base64.length) >= IMG_UPLOAD_MAX_SIZE * 1024) {
      ElMessage.error(`${file.name} 超过 ${IMG_UPLOAD_MAX_SIZE} MB，跳过选择`)
      resolve(null)
    }

    resolve({
      uuid: getUuid(),
      base64,
      file
    })
  })
}
