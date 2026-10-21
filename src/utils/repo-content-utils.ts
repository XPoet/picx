import type { UploadedImageModel, UserConfigInfoModel } from '@/common/model'
import { changeManagementDirectory, relocateManagementMedia } from '@/services/management'

/** 兼容旧调用方，远端与缓存写入统一在管理服务完成。 */
export async function renameDirOnGitHub(config: UserConfigInfoModel, path: string, name: string): Promise<boolean> {
  return (await changeManagementDirectory(config, path, name)).ok
}
export async function deleteDirOnGitHub(config: UserConfigInfoModel, path: string): Promise<boolean> {
  return (await changeManagementDirectory(config, path)).ok
}
export async function moveImageOnGitHub(config: UserConfigInfoModel, image: UploadedImageModel, directory: string): Promise<boolean> {
  return (await relocateManagementMedia(config, image, directory)).ok
}
