import { shallowRef } from 'vue'
import { getUuid } from '@/utils'

export const navInfoList = shallowRef([
  {
    uuid: getUuid(),
    name: 'nav.config',
    icon: IEpEdit,
    isActive: false,
    path: '/config',
    isShow: true
  },
  {
    uuid: getUuid(),
    name: 'nav.upload',
    icon: IEpUpload,
    isActive: false,
    path: '/upload',
    isShow: true
  },
  {
    uuid: getUuid(),
    name: 'nav.management',
    icon: IEpPicture,
    isActive: false,
    path: '/management',
    isShow: true
  },
  {
    uuid: getUuid(),
    name: 'nav.settings',
    icon: IEpSetting,
    isActive: false,
    path: '/settings',
    isShow: true
  },
  {
    uuid: getUuid(),
    name: 'nav.toolbox',
    icon: IEpFiles,
    isActive: false,
    path: '/toolbox',
    isShow: true
  },
  {
    uuid: getUuid(),
    name: 'nav.feedback',
    icon: IEpChatDotRound,
    isActive: false,
    path: '/feedback',
    isShow: true
  }
])
