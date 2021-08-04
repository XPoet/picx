// eslint-disable-next-line no-shadow
export enum UploadStatusEnum {
  // eslint-disable-next-line no-unused-vars
  uploaded = 'uploaded',
  // eslint-disable-next-line no-unused-vars
  allUploaded = 'allUploaded',
  // eslint-disable-next-line no-unused-vars
  uploadFail = 'uploadFail'
}

export interface UploadedImageModel {
  uuid: string
  dir: string
  name: string
  path: string
  sha: string
  // eslint-disable-next-line camelcase
  github_url: string
  // eslint-disable-next-line camelcase
  cdn_url: string
  // eslint-disable-next-line camelcase
  md_gh_url: string
  // eslint-disable-next-line camelcase
  md_cdn_url: string
  deleting: boolean
  // eslint-disable-next-line camelcase
  is_transform_md: boolean
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
    size: number
    lastModified: number
  }

  filename: {
    name: string
    hash: string
    suffix: string
    now: string
    initName: string
    newName: string
    isHashRename: boolean
    isRename: boolean
  }

  externalLink: {
    github: string
    cdn: string
    // eslint-disable-next-line camelcase
    markdown_gh: string
    // eslint-disable-next-line camelcase
    markdown_cdn: string
  }

  uploadedImg?: UploadedImageModel
}
