import { store } from '@/store'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { UserConfigInfoModel } from '../model/userConfigInfo.model'
import { compress } from './compress'
import { getFileSize, isImage } from './file-handle-helper'

export type handleResult = { base64: string; originalFile: File; compressFile?: File }

const selectedFileHandle = async (
  file: File,
  maxsize: number
): Promise<handleResult | null> => {
  if (!file) {
    return null
  }

  if (!isImage(file.type)) {
    ElMessage.error('该文件不是图片格式！')
    return null
  }
  let compressFile: NonNullable<File>
  const { personalSetting }: UserConfigInfoModel = store.getters.getUserConfigInfo
  const { defaultCompress, defaultCompressMethod } = personalSetting
  if (defaultCompress) {
    const loadingInstance = ElLoading.service({
      target: '.upload-area',
      text: '图片正在压缩····'
    })
    compressFile = await compress(file, defaultCompressMethod)
    loadingInstance.close()
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.readAsDataURL(defaultCompress ? compressFile : file)

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64: any = e.target?.result
      const curImgSize = getFileSize(base64.length)

      if (curImgSize >= maxsize) {
        // 给出提示，引导用户自行去压缩图片
        ElMessageBox.confirm(
          `当前图片 ${(curImgSize / 1024).toFixed(
            2
          )} M，CDN 只能加速小于 50 MB 的图片，建议使用第三方工具 TinyPNG 压缩`,
          '图片过大，禁止上传',
          {
            confirmButtonText: '前往 TinyPNG',
            cancelButtonText: '放弃上传'
          }
        )
          .then(() => {
            window.open('https://tinypng.com/')
          })
          .catch(() => {
            console.log('放弃上传')
          })
      } else {
        resolve({ base64, originalFile: file, compressFile })
      }
    }
  })
}

export default selectedFileHandle
