import { ElMessage } from 'element-plus'
import { isImage } from './fileHandleHelper'

function toPreviewer(dataUrl: string, fileName: any, cb: Function) {
  // eslint-disable-next-line no-unused-expressions
  cb && cb(dataUrl, fileName)
}

const chooseImg = (file: File, maxsize: number, cb: Function) => {
  if (!file) {
    return
  }

  if (!isImage(file.type)) {
    ElMessage.error('该文件不是图片格式！')
    return
  }

  const reader = new FileReader()

  reader.readAsDataURL(file)

  // eslint-disable-next-line func-names
  reader.onload = function () {
    // this.result 为 base64 图片编码
    // this 指向 reader 对象
    const { result } = this

    // 如果不判断图片大小 或 图片小于设置的大小，则不压缩，直接在上传区域预览
    if (maxsize === null || result.length <= maxsize) {
      // 预览图片
      toPreviewer(result, file, cb)
    } else {
      // 否则，压缩图片
      // todo: 压缩图片...
    }
  }
}

export default chooseImg
