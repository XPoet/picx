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
  checked: boolean
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

  uploadedImg?: UploadedImageModel

  reUploadImgPath?: string

  reUploadInfo: {
    isReUpload: boolean
    path: string
    dir: string
  }
}
