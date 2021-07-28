import { ToUploadImageModel } from '../model/upload.model'

export default function (): ToUploadImageModel {
  return {
    uuid: '',

    uploadStatus: {
      progress: 0,
      uploading: false
    },

    imgData: {
      base64Content: '',
      base64Url: '',
      base64Compress: ''
    },

    fileInfo: {
      compressSize: '0',
      userSetSize: '0',
      size: 0,
      lastModified: 0
    },

    filename: {
      name: '',
      hash: '',
      suffix: '',
      now: '',
      initName: '',
      newName: 'xxx',
      isHashRename: true,
      isRename: false,
      isCompress: false
    },

    externalLink: {
      github: '',
      cdn: '',
      markdown_gh: '',
      markdown_cdn: ''
    }
  }
}
