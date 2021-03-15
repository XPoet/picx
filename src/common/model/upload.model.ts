export enum UploadStatusEnum {
  waitUpload = 'waitUpload',
  uploading = 'uploading',
  uploaded = 'uploaded',
  allUploaded = 'allUploaded',
  uploadFail = 'uploadFail'
}

export interface ToUploadImageModel {

  uuid: string,

  uploadStatus: {
    progress: number;
    uploading: boolean;
  },

  imgData: {
    base64Content: string;
    base64Url: string;
  },

  fileInfo: {
    size: number;
    lastModified: number;
  },

  filename: {
    name: string;
    hash: string;
    suffix: string;
    now: string;
    initName: string;
    newName: string;
    isHashRename: boolean;
    isRename: boolean;
  },

  externalLink: {
    github: string;
    cdn: string;
    markdown_gh: string;
    markdown_cdn: string;
  },

  uploadedImg?: UploadedImageModel
}

export interface UploadedImageModel {
  uuid: string,
  dir: string,
  name: string,
  path: string,
  sha: string,
  github_url: string,
  cdn_url: string,
  md_gh_url: string,
  md_cdn_url: string,
  deleting: boolean
}
