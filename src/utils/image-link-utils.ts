import type { UploadedImageModel, UserSettingsModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { UploadItemSuccess } from '@/common/model/upload'
import { ElMessage } from 'element-plus'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'
import { copyText } from '@/utils/common-utils'

/** 规则、格式预览与复制共用；替换值不会再次被当作模板解析。 */
export function resolveImageLink(rule: string, repository: RepositoryIdentity, path: string): string | null {
  if (!rule || !path)
    return null
  const variables = { owner: encodeURIComponent(repository.owner), repo: encodeURIComponent(repository.repo), branch: encodeURIComponent(repository.branch), path: path.split('/').map(encodeURIComponent).join('/') }
  const link = rule.replace(/\{\{(owner|repo|branch|path)\}\}/g, (_, key: keyof typeof variables) => variables[key])
  try {
    return ['http:', 'https:'].includes(new URL(link).protocol) && !/\{\{[^}]+\}\}/.test(link) ? link : null
  }
  catch {
    return null
  }
}
export function formatImageLink(link: string | null, name: string, preferences: UserSettingsModel['imageLinkFormat']): string {
  if (!link)
    return ''
  if (!preferences.enable)
    return link
  const template = preferences.presetList.find(format => format.name === preferences.selected)?.format
  const imageName = name.replace(/\.[^.]+$/, '')
  return template ? template.replace(/imageLink|imageName/g, token => token === 'imageLink' ? link : imageName) : link
}
export function imageLinkText(image: Pick<UploadedImageModel, 'name' | 'path'>, target: RepositoryIdentity, settings: Pick<UserSettingsModel, 'imageLinkType' | 'imageLinkFormat'>): string {
  const rule = settings.imageLinkType.presetList[settings.imageLinkType.selected]?.rule ?? ''
  return formatImageLink(resolveImageLink(rule, target, image.path), image.name, settings.imageLinkFormat)
}
export function successLinkText(successes: readonly UploadItemSuccess[], settings: UserSettingsModel): string {
  return successes.map(result => imageLinkText(result.image, result.target, settings)).filter(Boolean).join('\n')
}

/** 兼容管理页等现有调用；上传页可显式传实际成功目标。 */
export function generateImageLink(image: UploadedImageModel, target: RepositoryIdentity = store.getters.getUserConfigInfo): string | null {
  const settings = store.getters.getUserSettings
  return resolveImageLink(settings.imageLinkType.presetList[settings.imageLinkType.selected]?.rule ?? '', target, image.path)
}
export async function copyLinkText(text: string, autoCopy = false) {
  if (!text) {
    ElMessage.error({ message: i18n.global.t('copy_fail_1') })
    return { ok: false, reason: 'invalid-link' } as const
  }
  return copyText(text, () => ElMessage({ type: autoCopy ? 'info' : 'success', message: i18n.global.t(autoCopy ? 'copy_success_1' : 'copy_success_2'), duration: autoCopy ? 6000 : 4000 }))
}
export function copyImageLink(image: UploadedImageModel, autoCopy = false, target: RepositoryIdentity = store.getters.getUserConfigInfo) {
  return copyLinkText(imageLinkText(image, target, store.getters.getUserSettings), autoCopy)
}
export function batchCopyImageLinks(images: UploadedImageModel[], autoCopy = false) {
  const settings = store.getters.getUserSettings
  const target = store.getters.getUserConfigInfo
  return copyLinkText(images.filter(image => image.path && image.sha).map(image => imageLinkText(image, target, settings)).filter(Boolean).join('\n'), autoCopy)
}
