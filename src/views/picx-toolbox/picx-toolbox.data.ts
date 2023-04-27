import { shallowRef } from 'vue'
import { ToolItemModel } from '@/common/model'
import { getUuid } from '@/utils'

export const toolboxList = shallowRef<ToolItemModel[]>([
  {
    name: '图片压缩',
    desc: '不限制图片大小和数量，不上传至服务器的离线极致压缩',
    icon: IEpMagicStick,
    uuid: getUuid(),
    path: '/compress'
  },
  {
    name: '图片转 Base64',
    desc: '不限制图片大小和数量，在线转换成 Base64 编码',
    icon: IEpPaperclip,
    uuid: getUuid(),
    path: '/base64'
  },
  {
    name: '图片水印',
    desc: '自定义水印文字、字体大小、位置、颜色和透明度',
    icon: IEpPostcard,
    uuid: getUuid(),
    path: '/watermark'
  }
])
