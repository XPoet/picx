import type { ImageHandleResult } from '@/common/model'
import { ElMessage } from 'element-plus'
import { IMG_UPLOAD_MAX_SIZE, VIDEO_UPLOAD_MAX_SIZE } from '@/common/constant'
import i18n from '@/plugins/vue/i18n'
import { getUuid } from '@/utils/common-utils'
import { imgFileToBase64 } from '@/utils/image-utils'

/**
 * 获取文件名
 * @param filename
 */
export const getFilename = (filename: string) => {
  const splitIndex = filename.lastIndexOf('.')
  return filename.substring(0, splitIndex).trim().replace(/\s+/g, '-')
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
  fileType = fileType.toLowerCase()
  return /(?:png|jpg|jpeg|gif|webp|awebp|avif|svg\+xml|svg|x-icon|vnd.microsoft.icon|ico)$/.test(
    fileType,
  )
}

/**
 * 判断文件类型是否为视频格式（当前仅支持 MP4，MIME 类型或文件名后缀均可）
 * @param fileType
 */
export const isVideo = (fileType: string): boolean => {
  return fileType.toLowerCase().endsWith('mp4')
}

/**
 * 判断是否需要压缩的图片格式
 * @param imageType
 */
export const isNeedCompress = (imageType: string): boolean => {
  imageType = imageType.toLowerCase()
  return /(?:png|jpg|jpeg|webp|avif)$/.test(imageType)
}

/**
 * 判断是否需要添加水印的图片格式
 * @param imageType
 */
export const isNeedWatermark = (imageType: string): boolean => {
  imageType = imageType.toLowerCase()
  return /(?:png|jpg|jpeg|webp|avif)$/.test(imageType)
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
 * 处理获取的文件（图片或视频）
 * @param file
 * @param allowVideo 是否允许视频格式，默认只允许图片
 */
export const gettingFilesHandle = (
  file: File,
  allowVideo: boolean = false,
): Promise<ImageHandleResult | null> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    if (!file) {
      resolve(null)
      return
    }

    const isVideoFile = allowVideo && isVideo(file.type)

    if (!isImage(file.type) && !isVideoFile) {
      ElMessage.error(i18n.global.t('upload_page.tip_9', { name: file.name }))
      resolve(null)
      return
    }

    const base64 = (await imgFileToBase64(file)) || ''

    const maxSize = isVideoFile ? VIDEO_UPLOAD_MAX_SIZE : IMG_UPLOAD_MAX_SIZE
    if (getFileSize(base64.length) >= maxSize * 1024) {
      ElMessage.error(
        i18n.global.t('upload_page.tip_10', { name: file.name, size: maxSize }),
      )
      resolve(null)
      return
    }

    resolve({
      uuid: getUuid(),
      base64,
      file,
    })
  })
}
