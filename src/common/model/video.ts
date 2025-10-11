/**
 * Uploaded video object Model
 */
export interface UploadedVideoModel {
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
}

/**
 * Upload list video object Model
 */
export interface UploadVideoModel {
  uuid: string

  base64: {
    originalBase64: string
    watermarkBase64: string | null
    compressBase64: string | null
  }

  objectURL: string

  fileInfo: {
    originalFile: File | null
    compressFile: File | null
    watermarkFile: File | null
  }

  filename: {
    name: string
    initName: string // initial name
    final: string // final name
    suffix: string // suffix
    isRename: boolean // whether to rename
    newName: string // new name
    isAddHash: boolean // whether to add hash
    hash: string // hash
    isAddPrefix: boolean // whether to add prefix
    prefix: string // prefix
  }

  uploadStatus: {
    progress: 0 | 100
    uploading: boolean
  }

  uploadedVideo?: UploadedVideoModel

  reUploadInfo?: {
    isReUpload: boolean
    path: string
    dir: string
  }
}
