import DirImageListStateTypes from './modules/dir-image-list/types'
import UserConfigInfoStateTypes from './modules/user-config-info/types'
import UploadAreaActiveStateTypes from './modules/upload-area-active/types'
import ToolboxImageListStateTypes from './modules/toolbox-image-list/types'
import UploadImageListStateTypes from './modules/upload-image-list/types'

export default interface RootStateTypes {
  rootName: string
}

export interface AllStateTypes extends RootStateTypes {
  dirImageListModule: DirImageListStateTypes
  userConfigInfoModule: UserConfigInfoStateTypes
  uploadAreaActiveModule: UploadAreaActiveStateTypes
  toolboxImageListModule: ToolboxImageListStateTypes
  uploadImageListModule: UploadImageListStateTypes
}
