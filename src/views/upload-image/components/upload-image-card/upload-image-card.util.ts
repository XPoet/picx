import type { UploadImageModel } from '@/common/model'
import { store } from '@/stores'
import { applyUploadNaming } from '@/utils/upload-naming'

function update(item: UploadImageModel, override: NonNullable<UploadImageModel['namingOverrides']>) {
  item.namingOverrides = { ...item.namingOverrides, ...override }
  applyUploadNaming(item, store.getters.getUserSettings.imageName)
}
export const addPrefixHandle = (enabled: boolean, item: UploadImageModel) => update(item, { isAddPrefix: enabled })
export const addHashHandle = (enabled: boolean, item: UploadImageModel) => update(item, { isAddHash: enabled })
export const rename = (enabled: boolean, item: UploadImageModel) => update(item, { isRename: enabled, newName: item.filename.newName })
