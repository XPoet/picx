/**
 * 已上传的图片对象 Model
 */
export interface UploadedImageModel {
  type: string
  uuid: string
  sha: string
  dir: string
  path: string
  name: string
  size: number
  deleting: boolean
  checked: boolean
}

/**
 * 等待上传的图片对象 Model
 */
export interface ToUploadImageModel {
  uuid: string

  uploadStatus: {
    progress: number
    uploading: boolean
  }

  imgData: {
    base64Content: string
    base64Url: string
  }

  fileInfo: {
    compressedSize?: number | undefined
    originSize?: number | undefined
    size: number | undefined
    lastModified: number | undefined
  }

  filename: {
    name: string
    hash: string
    suffix: string
    prefixName: string
    final: string
    initName: string
    newName: string
    isHashRename: boolean
    isRename: boolean
    isPrefix: boolean
  }

  uploadedImg?: UploadedImageModel

  reUploadImgPath?: string

  reUploadInfo: {
    isReUpload: boolean
    path: string
    dir: string
  }
}

/**
 * 图片上传状态枚举
 */
export enum UploadStatusEnum {
  uploaded = 'uploaded',
  allUploaded = 'allUploaded',
  uploadFail = 'uploadFail'
}

/**
 * 图片删除状态枚举
 */
export enum DeleteStatusEnum {
  deleted = 'deleted',
  allDeleted = 'allDeleted',
  deleteFail = 'deleteFail'
}

/**
 * 图片压缩编码器枚举
 */
export enum CompressEncoderEnum {
  mozJPEG = 'mozJPEG',
  avif = 'avif',
  webP = 'webP'
}

/**
 * 图片链接规则对象 Model
 */
export interface ImageLinkRuleModel {
  id: string
  name: string
  rule: string
  editable?: boolean
}

/**
 * 图片链接格式对象 Model
 */
export interface ImageLinkFormatModel {
  name: string
  format: string
}
