import request from '@/utils/request'

/**
 * Git tree 条目
 * sha 为 null 时表示从 base_tree 中删除对应路径
 */
export interface GitTreeEntry {
  path: string
  mode?: string
  type?: 'blob' | 'tree'
  sha: string | null
}

/**
 * 分支 head 信息（getBranchInfo 返回中本实现用到的字段）
 */
export interface GitBranchHeadInfo {
  commit: {
    sha: string
    commit: {
      tree: { sha: string }
    }
  }
}

/**
 * 递归 tree 对象信息（getGitTreeRecursive 返回）
 */
export interface GitTreeObjectInfo {
  sha: string
  truncated?: boolean
  tree: Array<{
    path: string
    mode: string
    type: string
    sha: string
  }>
}

/**
 * Contents API 目录内容条目
 */
export interface RepoContentItemInfo {
  name: string
  path: string
  sha: string
  type: string
}

/**
 * 递归获取仓库指定 tree 下的所有节点（blob 和 tree）
 * @param owner
 * @param repo
 * @param treeSha tree 对象 SHA
 */
export const getGitTreeRecursive = (owner: string, repo: string, treeSha: string) => {
  return request({
    url: `/repos/${owner}/${repo}/git/trees/${treeSha}`,
    method: 'GET',
    noCache: true,
    params: {
      recursive: '1',
    },
  })
}

/**
 * 基于 head commit 的 tree 创建新 tree
 * @param owner
 * @param repo
 * @param entries tree 条目列表（sha 为 null 表示删除路径）
 * @param head 分支 head 信息
 */
export const createGitTree = (
  owner: string,
  repo: string,
  entries: GitTreeEntry[],
  head: GitBranchHeadInfo | null,
) => {
  return request({
    url: `/repos/${owner}/${repo}/git/trees`,
    method: 'POST',
    data: {
      tree: entries.map(entry => ({
        path: entry.path,
        mode: entry.mode || '100644',
        type: entry.type || 'blob',
        sha: entry.sha,
      })),
      base_tree: head?.commit?.commit?.tree?.sha || null,
    },
  })
}
