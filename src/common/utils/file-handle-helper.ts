import { getUuid } from './common-utils'

/**
 * get filename
 * @param filename
 */
export const getFilename = (filename: string) => {
  const splitIndex = filename.indexOf('.')
  return filename.substr(0, splitIndex).trim().replace(/\s+/g, '-')
}

/**
 * get filename suffix
 * @param filename
 */
export const getFileSuffix = (filename: string) => {
  const splitIndex = filename.lastIndexOf('.')
  return filename.substr(splitIndex + 1, filename.length)
}

export const isImage = (suffix: string): boolean => {
  return /(png|jpg|gif|jpeg|webp|avif|svg\+xml|image\/x-icon)$/.test(suffix)
}

/**
 * get file size (KB)
 * @param size
 */
export const getFileSize = (size: number) => {
  return Number((size / 1024).toFixed(2))
}

/**
 * filename handle
 * @param filename
 */
export const filenameHandle = (filename: string | undefined) => {
  if (filename) {
    return {
      name: getFilename(filename),
      hash: getUuid(),
      suffix: getFileSuffix(filename)
    }
  }
  return {
    name: '',
    hash: '',
    suffix: ''
  }
}
