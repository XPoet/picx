/**
 * 图床管理页排序模式枚举
 */
export enum ImageSortEnum {
  /** 默认排序（GitHub API 返回顺序） */
  default = 'default',

  /** 名称升序 */
  nameAsc = 'nameAsc',

  /** 名称降序 */
  nameDesc = 'nameDesc',

  /** 最新上传优先（按上传时间降序） */
  timeDesc = 'timeDesc',
}

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
  deployed?: boolean
  /** 上传时间（毫秒时间戳）；历史数据或未回填的数据为 undefined */
  uploadTime?: number
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
    timestamp: string // 时间戳命名时生成的时间戳，空字符串表示未使用时间戳命名
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
  uploaded = 'uploaded',

  allUploaded = 'allUploaded',

  uploadFail = 'uploadFail',
}

/**
 * 图片删除状态枚举
 */
export enum DeleteStatusEnum {
  deleted = 'deleted',

  allDeleted = 'allDeleted',

  deleteFail = 'deleteFail',
}

/**
 * 图片压缩编码器枚举
 */
export enum CompressEncoderEnum {
  mozJPEG = 'mozJPEG',

  avif = 'avif',

  webP = 'webP',

  png = 'png',
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
  GitHub = 'GitHub',

  GitHubPages = 'GitHub Pages',

  jsDelivr = 'jsDelivr',

  ChinaJsDelivr = 'ChinaJsDelivr',

  Statically = 'Statically',
}
