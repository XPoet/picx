import { ElMessage, ElMessageBox } from 'element-plus'
import { getFileSize, isImage } from './fileHandleHelper'

const selectedFileHandle = (file: File, maxsize: number): Promise<string> | null => {
  if (!file) {
    return null
  }

  if (!isImage(file.type)) {
    ElMessage.error('该文件不是图片格式！')
    return null
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.readAsDataURL(file)

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64: any = e.target?.result
      const curImgSize = getFileSize(base64?.length)

      if (curImgSize >= maxsize) {
        // 给出提示，引导用户自行去压缩图片
        ElMessageBox.confirm(
          `当前图片 ${(curImgSize / 1024).toFixed(2)} M，CDN 只能加速小于 30M 的图片，建议使用第三方工具 TinyPNG 压缩?`,
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
        resolve(base64)
      }
    }
  })
}

export default selectedFileHandle
