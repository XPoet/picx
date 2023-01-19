export enum UploadStatusEnum {
  uploaded = 'uploaded',
  allUploaded = 'allUploaded',
  uploadFail = 'uploadFail'
}

export interface UploadedImageModel {
  type: string
  uuid: string
  sha: string
  dir: string
  path: string
  name: string
  size: any
  deleting: boolean
  is_transform_md: boolean
  checked: boolean
  github_url: string
  jsdelivr_cdn_url: string
  staticaly_cdn_url: string
  zzko_cdn_url: string
}

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
    now: string
    initName: string
    newName: string
    isHashRename: boolean
    isRename: boolean
    isPrefix: boolean
  }

  externalLink: {
    github: string
    jsdelivr: string
    staticaly: string
    zzko: string
  }

  uploadedImg?: UploadedImageModel
}
