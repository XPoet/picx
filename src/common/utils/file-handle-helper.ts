import getUuid from './get-uuid'

export const filenameHandle = (filename: string | undefined) => {
  if (filename) {
    const splitIndex = filename.lastIndexOf('.')
    const name = filename.substr(0, splitIndex).trim().replace(/\s+/g, '-')
    const suffix = filename.substr(splitIndex + 1, filename.length)

    return {
      name,
      hash: getUuid(),
      suffix
    }
  }
  return {
    name: '',
    hash: '',
    suffix: ''
  }
}

export const hashFilenameHandle = (hashFilename: string) => {
  const splitIndex = hashFilename.indexOf('.')
  return hashFilename.substr(0, splitIndex)
}

export const isImage = (suffix: string): boolean => {
  return /(png|jpg|gif|jpeg|webp|avif|svg\+xml|image\/x-icon)$/.test(suffix)
}

export const getFileSize = (size: number) => {
  return Number((size / 1024).toFixed(2))
}
