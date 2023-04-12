export interface ToolItemModel {
  uuid: string
  name: string
  path: string
  desc: string
  icon: string
}

export interface ImageHandleResult {
  uuid: string
  base64: string
  file: File
}

export interface ImgProcessStateModel {
  uuid: string
  originalName: string
  originalSize: number
  originalBase64: string
  originalFile: File
  finialName?: string
  finialBase64?: string
  finialSize?: number
  finialFile?: File
  processing?: boolean
}
