import { getUuid } from './common-utils'
import { store } from '@/store'
import { compressImage } from '@/utils/compress-image'

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
 * 判断后缀是否是图片格式
 * @param suffix
 */
export const isImage = (suffix: string): boolean => {
  return /(png|jpg|gif|jpeg|webp|avif|svg\+xml|image\/x-icon)$/.test(suffix)
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

export type handleResult = { base64: string; originalFile: File; compressFile?: File }

/**
 * 处理选择的文件
 * @param file
 * @param maxsize
 */
export const selectedFileHandle = async (
  file: File,
  maxsize: number
): Promise<handleResult | null> => {
  if (!file) {
    return null
  }

  if (!isImage(file.type)) {
    ElMessage.error('该文件格式不支持上传！')
    return null
  }
  let compressFile: NonNullable<File>
  const { isCompress, compressEncoder } = store.getters.getUserSettings
  const isGif = file.type === 'image/gif'
  if (!isGif && isCompress) {
    const loadingInstance = ElLoading.service({
      target: '.upload-area',
      text: '正在压缩图片'
    })
    compressFile = await compressImage(file, compressEncoder)
    loadingInstance.close()
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(!isGif && isCompress ? compressFile : file)
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64: any = e.target?.result
      const curImgSize = getFileSize(base64.length)

      if (curImgSize >= maxsize) {
        // 给出提示，引导用户自行去压缩图片
        ElMessageBox.confirm(
          `当前图片 ${(curImgSize / 1024).toFixed(
            2
          )} M，CDN 只能加速小于 50 MB 的图片，建议使用第三方工具 TinyPNG 压缩`,
          '图片过大，禁止上传',
          {
            confirmButtonText: '前往 TinyPNG',
            cancelButtonText: '放弃上传'
          }
        )
          .then(() => {
            window.open('https://tinypng.com/')
          })
          .catch(() => {
            console.log('放弃上传')
          })
      } else {
        resolve({
          base64,
          originalFile: file,
          compressFile: !isGif && isCompress ? compressFile : file
        })
      }
    }
  })
}

/**
 * 处理复制的文件
 * @param e
 * @param maxsize
 */
export const pasteFileHandle = (e: any, maxsize: number): Promise<any> | null => {
  if (!(e.clipboardData && e.clipboardData.items)) {
    return null
  }

  // eslint-disable-next-line consistent-return
  return new Promise((resolve) => {
    // eslint-disable-next-line no-plusplus
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      const item = e.clipboardData.items[i]
      if (item.kind === 'file') {
        const pasteFile = item.getAsFile()

        selectedFileHandle(pasteFile, maxsize)?.then((result) => {
          if (!result) {
            return
          }
          const { base64, originalFile, compressFile } = result
          resolve({ base64, originalFile, compressFile })
        })
      }
    }
  })
}
