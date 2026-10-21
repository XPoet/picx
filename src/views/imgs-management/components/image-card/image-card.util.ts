import type { UploadedImageModel } from '@/common/model'
import { deleteManagementMedia, relocateManagementMedia } from '@/services/management'
import { deleteMediaWithConfirmation, openMediaMove, renameMedia, showMediaProperties } from '@/services/management-actions'
import { store } from '@/stores'

export const doDeleteImage = (image: UploadedImageModel) => deleteManagementMedia(store.getters.getUserConfigInfo, [image])
export const onDeleteImage = (image: UploadedImageModel) => deleteMediaWithConfirmation([image])
export const onMoveImage = openMediaMove
export const doRenameImage = async (image: UploadedImageModel, name: string) => (await relocateManagementMedia(store.getters.getUserConfigInfo, image, image.dir, name)).ok
export const onRenameImage = renameMedia
export const checkImgProperty = showMediaProperties
