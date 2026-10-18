import type { UserSettingsModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiResult } from '@/utils/request/types'
import type { SettingsPayload } from '@/utils/settings-payload'
import { PICX_INIT_SETTINGS_MSG, PICX_UPDATE_SETTINGS_MSG } from '@/common/constant'
import { requestResult } from '@/utils/request'
import { projectSettings, readSettingsPayload } from '@/utils/settings-payload'

export interface CloudSettingsFileModel { sha: string, content: string }
export type CloudSettingsRead = { kind: 'missing' } | { kind: 'present', file: CloudSettingsFileModel, settings: SettingsPayload }
export const encodeSettingsBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  return window.btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
}
export function parseCloudSettings(file: CloudSettingsFileModel): SettingsPayload | null {
  try {
    const bytes = Uint8Array.from(window.atob(file.content), char => char.charCodeAt(0))
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    return readSettingsPayload(value)
  }
  catch { return null }
}
function isFile(value: unknown): value is CloudSettingsFileModel {
  return Boolean(value && typeof value === 'object' && 'sha' in value && typeof value.sha === 'string' && value.sha && 'content' in value && typeof value.content === 'string')
}
export async function getCloudSettings(target: RepositoryIdentity): Promise<ApiResult<CloudSettingsRead>> {
  const result = await requestResult({ url: `/repos/${target.owner}/${target.repo}/contents/.settings`, method: 'GET', params: { ref: target.branch }, noCache: true }, isFile)
  if (!result.ok)
    return result.error.kind === 'not-found' ? { ok: true, data: { kind: 'missing' } } : result
  const settings = parseCloudSettings(result.data)
  return settings ? { ok: true, data: { kind: 'present', file: result.data, settings } } : { ok: false, error: { kind: 'invalid-response', retryable: true } }
}
export async function saveCloudSettingsResult(settings: UserSettingsModel, target: RepositoryIdentity, current: () => boolean = () => true): Promise<ApiResult<unknown>> {
  const read = await getCloudSettings(target)
  if (!read.ok)
    return read
  if (!current())
    return { ok: false, error: { kind: 'conflict', retryable: true } }
  return requestResult({
    url: `/repos/${target.owner}/${target.repo}/contents/.settings`,
    method: 'PUT',
    data: { message: read.data.kind === 'present' ? PICX_UPDATE_SETTINGS_MSG : PICX_INIT_SETTINGS_MSG, content: encodeSettingsBase64(JSON.stringify(projectSettings(settings))), branch: target.branch, ...(read.data.kind === 'present' ? { sha: read.data.file.sha } : {}) },
  }, (value): value is { content: { sha: string } } => Boolean(value && typeof value === 'object' && 'content' in value && value.content && typeof value.content === 'object' && 'sha' in value.content && typeof value.content.sha === 'string'))
}
/** 兼容旧布尔调用方；失败不记录响应对象或正文。 */
export async function saveCloudSettings(settings: UserSettingsModel, target: RepositoryIdentity): Promise<boolean> {
  return (await saveCloudSettingsResult(settings, target)).ok
}
