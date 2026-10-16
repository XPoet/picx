import type { ImageHandleResult } from '@/common/model'
import { ElMessage } from 'element-plus'
import { IMG_UPLOAD_MAX_SIZE, VIDEO_UPLOAD_MAX_SIZE } from '@/common/constant'
import i18n from '@/plugins/vue/i18n'
import { imgFileToBase64 } from '@/utils/image-utils'

/**
 * 获取文件名
 * @param filename
 */
export const getFilename = (filename: string) => {
  const splitIndex = filename.lastIndexOf('.')
  return (splitIndex > 0 ? filename.slice(0, splitIndex) : filename).trim().replace(/\s+/g, '-')
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
export function validateUploadFile(file: File, allowVideo = false): { ok: true } | { ok: false, reason: 'type' | 'size', maxSize: number } {
  const video = allowVideo && isVideo(file.type)
  const maxSize = video ? VIDEO_UPLOAD_MAX_SIZE : IMG_UPLOAD_MAX_SIZE
  if (!isImage(file.type) && !video)
    return { ok: false, reason: 'type', maxSize }
  return file.size <= maxSize * 1024 * 1024 ? { ok: true } : { ok: false, reason: 'size', maxSize }
}

export async function gettingFilesHandle(file: File, allowVideo = false): Promise<ImageHandleResult | null> {
  const validation = validateUploadFile(file, allowVideo)
  if (!validation.ok) {
    ElMessage.error(validation.reason === 'type'
      ? i18n.global.t('upload_page.tip_9', { name: file.name })
      : i18n.global.t('upload_page.tip_10', { name: file.name, size: validation.maxSize }))
    return null
  }
  const base64 = await imgFileToBase64(file)
  if (!base64) {
    ElMessage.error(i18n.global.t('upload_workspace.read_failed', { name: file.name }))
    return null
  }
  return { uuid: crypto.randomUUID(), base64, file }
}

/** 未知大小不伪装为 0 KB；零字节显式显示 0 B。 */
export function formatFileBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes))
    return '—'
  if (bytes < 1024)
    return `${bytes} B`
  const unit = bytes < 1024 * 1024 ? 'KB' : 'MB'
  return `${Number((bytes / (unit === 'KB' ? 1024 : 1024 * 1024)).toFixed(2))} ${unit}`
}
