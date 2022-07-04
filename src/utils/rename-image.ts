import { computed } from 'vue'
import { store } from '@/store'
import createToUploadImageObject from '@/utils/create-to-upload-image'
import { filenameHandle } from './file-handle-helper'

/**
 * 根据图片链接获取图片 base64 编码
 * @param url 图片路径
 * @param ext 图片格式
 */
export function getBase64ByImageUrl(url: string, ext: string): Promise<string | null> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = url
  return new Promise((resolve) => {
    img.onload = () => {
      const { width } = img
      const { height } = img
      canvas.width = width // 指定画板的高度，自定义
      canvas.height = height // 指定画板的宽度，自定义
      ctx?.drawImage(img, 0, 0, width, height) // 参数可自定义
      const dataURL: string = canvas.toDataURL(`image/${ext}`)
      resolve(dataURL)
    }
  })
}

// 获取图片对象
export function getImage(base64Data: string, file: any) {
  const userSettings = computed(() => store.getters.getUserSettings).value
  const curImg = createToUploadImageObject()

  curImg.imgData.base64Url = base64Data
  // eslint-disable-next-line prefer-destructuring
  curImg.imgData.base64Content = base64Data.split(',')[1]

  const { name, hash, suffix } = filenameHandle(file.name)
  curImg.uuid = hash

  curImg.fileInfo.size = file.size
  curImg.fileInfo.originSize = file.size
  curImg.fileInfo.lastModified = file.lastModified

  curImg.filename.name = name
  curImg.filename.hash = hash
  curImg.filename.suffix = suffix
  curImg.filename.now = userSettings.defaultHash
    ? `${name}.${hash}.${suffix}`
    : `${name}.${suffix}`
  curImg.filename.initName = name
  curImg.filename.isHashRename = userSettings.defaultHash

  return curImg
}
