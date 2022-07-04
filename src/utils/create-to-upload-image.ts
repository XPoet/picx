import { ToUploadImageModel } from '../common/model/upload.model'

export default (): ToUploadImageModel => {
  return {
    uuid: '',

    uploadStatus: {
      progress: 0,
      uploading: false
    },

    imgData: {
      base64Content: '',
      base64Url: ''
    },

    fileInfo: {
      size: 0,
      lastModified: 0
    },

    filename: {
      name: '',
      hash: '',
      suffix: '',
      prefixName: '',
      now: '',
      initName: '',
      newName: 'xxx',
      isHashRename: true,
      isRename: false,
      isPrefix: false
    },

    externalLink: {
      github: '',
      jsdelivr: '',
      staticaly: '',
      cloudflare: ''
    }
  }
}
