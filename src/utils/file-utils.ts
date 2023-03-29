import { getUuid } from './common-utils'
import { store } from '@/store'
import { compressImage } from '@/utils/compress-image'
import { ImageFileHandleResult, IMG_UPLOAD_MAX_SIZE } from '@/common/model'

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
  const splitIndex = filename.lastIndexOf('.')
  return filename.substr(splitIndex + 1, filename.length)
}

/**
 * 判断文件类型是否为图片格式
 * @param fileType
 */
export const isImage = (fileType: string): boolean => {
  return /(png|jpg|gif|jpeg|webp|awebp|avif|svg\+xml|image\/x-icon)$/.test(fileType)
}

/**
 * 获取文件大小 (KB)
 * @param size
 */
export const getFileSize = (size: number) => {
  return Number((size / 1024).toFixed(2))
}

/**
 * 文件名处理
 * @param filename
 */
export const filenameHandle = (filename: string | undefined) => {
  return {
    name: filename ? getFilename(filename) : '',
    hash: filename ? getUuid() : '',
    suffix: filename ? getFileSuffix(filename) : ''
  }
}

/**
 * 处理选择的文件
 * @param file
 */
export const selectedFileHandle = async (file: File): Promise<ImageFileHandleResult | null> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    if (!file) {
      resolve(null)
    }

    if (!isImage(file.type)) {
      ElMessage.error('该文件格式不支持上传！')
      resolve(null)
    }

    let compressFile: NonNullable<File>
    const { isCompress, compressEncoder } = store.getters.getUserSettings
    const isNoCompress = file.type === 'image/gif'

    if (!isNoCompress && isCompress) {
      compressFile = await compressImage(file, compressEncoder)
    }

    const reader = new FileReader()
    // @ts-ignore
    reader.readAsDataURL(!isNoCompress && isCompress ? compressFile : file)
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64: any = e.target?.result
      const curImgSize = getFileSize(base64.length)

      if (curImgSize >= IMG_UPLOAD_MAX_SIZE * 1024) {
        ElMessage.error(`该图片超过 ${IMG_UPLOAD_MAX_SIZE} MB，不允许上传！`)
        resolve(null)
      } else {
        resolve({
          base64,
          originalFile: file,
          compressFile: !isNoCompress && isCompress ? compressFile : file
        })
      }
    }
  })
}
