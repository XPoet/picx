import { shallowRef } from 'vue'
import { ToolItemModel } from '@/common/model'
import { getUuid } from '@/utils'

export const toolboxList = shallowRef<ToolItemModel[]>([
  {
    name: 'toolbox.tool_1',
    desc: 'toolbox.tool_1_desc',
    icon: IEpMagicStick,
    uuid: getUuid(),
    path: '/compress'
  },
  {
    name: 'toolbox.tool_2',
    desc: 'toolbox.tool_2_desc',
    icon: IEpPaperclip,
    uuid: getUuid(),
    path: '/base64'
  },
  {
    name: 'toolbox.tool_3',
    desc: 'toolbox.tool_3_desc',
    icon: IEpPostcard,
    uuid: getUuid(),
    path: '/watermark'
  }
])
