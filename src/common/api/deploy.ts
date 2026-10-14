import type { UserConfigInfoModel } from '@/common/model'
import {
  PICX_DEL_CNAME_MSG,
  PICX_INIT_CNAME_MSG,
  PICX_UPDATE_CNAME_MSG,
} from '@/common/constant'
import request from '@/utils/request'

const filename = 'CNAME'

/**
 * 自定义域名同步到云端仓库指定分支根目录 CNAME 文件的结果状态
 */
export enum CloudCnameSyncStatusEnum {
  /** CNAME 文件已创建 */
  created = 'created',

  /** CNAME 文件已更新 */
  updated = 'updated',

  /** CNAME 文件已删除 */
  deleted = 'deleted',

  /** CNAME 文件内容与域名已一致，无需写入 */
  consistent = 'consistent',

  /** 域名为空且目标分支不存在 CNAME 文件，无需处理 */
  skipped = 'skipped',

  /** 同步失败 */
  failed = 'failed',
}

/**
 * 规范化自定义域名输入：去掉协议、路径和首尾空白，统一小写
 */
export const normalizeCustomDomain = (domain: string): string => {
  return domain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
}

/**
 * 校验自定义域名格式，例如 img.example.com（各段仅允许字母数字和中划线，且中划线不能在段首尾）
 */
export const isValidCustomDomain = (domain: string): boolean => {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
    domain,
  )
}

interface CnamePayloadModel {
  message: string
  branch: string
  content?: string
  sha?: string
}

interface CnameFileModel {
  sha: string
  content?: string
}

/**
 * 解码 CNAME 文件内容，失败返回空字符串（视为与任何域名不一致，走覆盖写入）
 */
const decodeCnameContent = (file: CnameFileModel): string => {
  try {
    return window.atob(file.content ?? '').trim()
  }
  catch {
    return ''
  }
}

/**
 * 同步自定义域名到云端仓库指定分支根目录的 CNAME 文件。
 *
 * - 域名非空：文件不存在则创建，内容不一致则更新，已一致则跳过写入
 * - 域名为空：删除已有的 CNAME 文件，不存在则跳过
 *
 * 一键部署场景下先同步图床仓库当前分支，gh-pages 分支由当前分支复制创建，
 * 自定义域名随分支带入部署分支，保证部署结果与 .settings 的 customDomain 一致。
 *
 * @param userConfigInfo
 * @param domain 自定义域名（未校验格式时内部会先规范化，非法域名返回 failed）
 * @param branch 目标分支
 */
export const syncCloudCnameFile = async (
  userConfigInfo: UserConfigInfoModel,
  domain: string,
  branch: string,
): Promise<CloudCnameSyncStatusEnum> => {
  const { owner, repo } = userConfigInfo
  const customDomain = normalizeCustomDomain(domain)

  if (!owner || !repo || !branch || (customDomain && !isValidCustomDomain(customDomain))) {
    return CloudCnameSyncStatusEnum.failed
  }

  // 查询 CNAME 文件是否已存在（不存在或请求失败返回 null）
  const fileRes: CnameFileModel | null = await request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'GET',
    noShowErrMsg: true,
    noCache: true,
    params: {
      ref: branch,
    },
  })

  if (customDomain) {
    if (fileRes && decodeCnameContent(fileRes) === customDomain) {
      return CloudCnameSyncStatusEnum.consistent
    }

    const payload: CnamePayloadModel = {
      message: fileRes ? PICX_UPDATE_CNAME_MSG : PICX_INIT_CNAME_MSG,
      content: window.btoa(customDomain),
      branch,
    }
    if (fileRes) {
      payload.sha = fileRes.sha
    }

    const res = await request({
      url: `/repos/${owner}/${repo}/contents/${filename}`,
      method: 'PUT',
      data: payload,
      noShowErrMsg: true,
    })

    return res
      ? fileRes
        ? CloudCnameSyncStatusEnum.updated
        : CloudCnameSyncStatusEnum.created
      : CloudCnameSyncStatusEnum.failed
  }

  // 域名为空：清理已有的 CNAME 文件
  if (!fileRes) {
    return CloudCnameSyncStatusEnum.skipped
  }

  const res = await request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'DELETE',
    data: {
      message: PICX_DEL_CNAME_MSG,
      sha: fileRes.sha,
      branch,
    } satisfies CnamePayloadModel,
    noShowErrMsg: true,
  })

  return res ? CloudCnameSyncStatusEnum.deleted : CloudCnameSyncStatusEnum.failed
}
