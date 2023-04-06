import DirImageListStateTypes from './modules/dir-image-list/types'
import ToUploadImageStateTypes from './modules/to-upload-image/types'
import UploadedImageListStateTypes from './modules/uploaded-image-list/types'
import UserConfigInfoStateTypes from './modules/user-config-info/types'
import UploadAreaActiveStateTypes from './modules/upload-area-active/types'
import ToolboxImageListStateTypes from './modules/toolbox-image-list/types'

export default interface RootStateTypes {
  rootName: string
}

export interface AllStateTypes extends RootStateTypes {
  dirImageListModule: DirImageListStateTypes
  toUploadImageModule: ToUploadImageStateTypes
  uploadedImageListModule: UploadedImageListStateTypes
  userConfigInfoModule: UserConfigInfoStateTypes
  uploadAreaActiveModule: UploadAreaActiveStateTypes
  toolboxImageListModule: ToolboxImageListStateTypes
}
