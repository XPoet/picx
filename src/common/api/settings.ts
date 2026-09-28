import type { UserConfigInfoModel, UserSettingsModel } from '@/common/model'
import { PICX_INIT_SETTINGS_MSG, PICX_UPDATE_SETTINGS_MSG } from '@/common/constant'
import request from '@/utils/request'

const filename = '.settings'

/**
 * 云端设置文件（.settings）的 GitHub Contents API 返回结构
 */
export interface CloudSettingsFileModel {
  sha: string
  content: string
}

interface PutContentPayload {
  message: string
  content: string
  branch?: string
  sha?: string
}

/**
 * UTF-8 安全的 Base64 编码（水印文字等内容包含中文时，window.btoa 会直接抛异常）
 */
const encodeBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return window.btoa(binary)
}

/**
 * UTF-8 安全的 Base64 解码
 */
const decodeBase64 = (base64: string): string => {
  const binary = window.atob(base64)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * 获取云端仓库的设置文件（.settings）原始信息，文件不存在或请求失败时返回 null
 */
export const getCloudSettings = async (
  userConfigInfo: UserConfigInfoModel,
): Promise<CloudSettingsFileModel | null> => {
  const { owner, repo } = userConfigInfo
  return request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'GET',
    noShowErrMsg: true,
    noCache: true,
  })
}

/**
 * 将云端设置文件（.settings）内容解析为用户设置数据，内容损坏时返回 null
 */
export const parseCloudSettings = (file: CloudSettingsFileModel): UserSettingsModel | null => {
  try {
    const settings = JSON.parse(decodeBase64(file.content))
    return settings && typeof settings === 'object' ? settings : null
  }
  catch (err) {
    console.error('PicX Error // parse cloud settings failed >> ', err)
    return null
  }
}

/**
 * 保存用户设置数据到云端仓库，成功返回 true
 */
export const saveCloudSettings = async (
  userSettings: UserSettingsModel,
  userConfigInfo: UserConfigInfoModel,
): Promise<boolean> => {
  const { owner, repo, branch } = userConfigInfo

  const cloudFile = await getCloudSettings(userConfigInfo)

  const payload: PutContentPayload = {
    message: cloudFile ? PICX_UPDATE_SETTINGS_MSG : PICX_INIT_SETTINGS_MSG,
    content: encodeBase64(JSON.stringify(userSettings)),
  }

  if (cloudFile) {
    payload.sha = cloudFile.sha
  }
  else {
    payload.branch = branch
  }

  const res = await request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'PUT',
    data: payload,
    noShowErrMsg: true,
  })

  return Boolean(res)
}
