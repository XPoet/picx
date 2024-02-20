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
  active?: boolean
}

/**
 * 上传列表的图片对象 Model
 */
export interface UploadImageModel {
  uuid: string

  base64: {
    originalBase64: string
    watermarkBase64: string | null
    compressBase64: string | null
  }

  fileInfo: {
    originalFile: File | null
    watermarkFile: File | null
    compressFile: File | null
  }

  filename: {
    name: string
    initName: string // 初始名称
    final: string // 最终名称
    suffix: string // 后缀
    isRename: boolean // 是否重命名
    newName: string // 新名称
    isAddHash: boolean // 是否添加哈希值
    hash: string // 哈希值
    isAddPrefix: boolean // 是否添加前缀
    prefix: string // 前缀
  }

  // 上传前的状态
  beforeUploadStatus: {
    compressing: boolean
    watermarking: boolean
  }

  uploadStatus: {
    progress: 0 | 100
    uploading: boolean
  }

  uploadedImg?: UploadedImageModel

  reUploadInfo?: {
    isReUpload: boolean
    path: string
    dir: string
  }
}

/**
 * 图片上传状态枚举
 */
export enum UploadStatusEnum {
  // eslint-disable-next-line no-unused-vars
  uploaded = 'uploaded',
  // eslint-disable-next-line no-unused-vars
  allUploaded = 'allUploaded',
  // eslint-disable-next-line no-unused-vars
  uploadFail = 'uploadFail'
}

/**
 * 图片删除状态枚举
 */
export enum DeleteStatusEnum {
  // eslint-disable-next-line no-unused-vars
  deleted = 'deleted',
  // eslint-disable-next-line no-unused-vars
  allDeleted = 'allDeleted',
  // eslint-disable-next-line no-unused-vars
  deleteFail = 'deleteFail'
}

/**
 * 图片压缩编码器枚举
 */
export enum CompressEncoderEnum {
  // eslint-disable-next-line no-unused-vars
  mozJPEG = 'mozJPEG',
  // eslint-disable-next-line no-unused-vars
  avif = 'avif',
  // eslint-disable-next-line no-unused-vars
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

/**
 * 图片链接类型名称枚举
 */
export enum ImageLinkTypeEnum {
  // eslint-disable-next-line no-unused-vars
  GitHub = 'GitHub',
  // eslint-disable-next-line no-unused-vars
  GitHubPages = 'GitHub Pages',
  // eslint-disable-next-line no-unused-vars
  jsDelivr = 'jsDelivr',
  // eslint-disable-next-line no-unused-vars
  ChinaJsDelivr = 'ChinaJsDelivr',
  // eslint-disable-next-line no-unused-vars
  Statically = 'Statically'
}
