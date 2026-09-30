import type {
  GitBranchHeadInfo,
  GitTreeEntry,
  GitTreeObjectInfo,
  RepoContentItemInfo,
} from '@/common/api'
import type { UploadedImageModel, UserConfigInfoModel } from '@/common/model'
import {
  createCommit,
  createGitTree,
  createRef,
  getBranchInfo,
  getGitTreeRecursive,
  getRepoDirContent,
} from '@/common/api'
import { PICX_DEL_DIR_DESC, PICX_MOVE_IMG_DESC, PICX_RENAME_DIR_DESC } from '@/common/constant'
import { store } from '@/stores'

interface DirBlob {
  path: string
  sha: string
  mode: string
}

/**
 * 基于分支 head 创建 tree、commit 并更新分支 ref（一次 commit 完成全部路径变更）
 * @param userConfigInfo
 * @param entries tree 条目列表（sha 为 null 表示删除路径）
 * @param message commit 信息
 */
const commitTreeChanges = async (
  userConfigInfo: UserConfigInfoModel,
  entries: GitTreeEntry[],
  message: string,
): Promise<boolean> => {
  const { owner, repo, branch } = userConfigInfo

  const headRes: GitBranchHeadInfo | null = await getBranchInfo(owner, repo, branch)
  if (!headRes) {
    return false
  }

  const treeRes: { sha: string } | null = await createGitTree(owner, repo, entries, headRes)
  if (!treeRes) {
    return false
  }

  const commitRes: { sha: string } | null = await createCommit(owner, repo, treeRes, headRes, message)
  if (!commitRes) {
    return false
  }

  const refRes = await createRef(owner, repo, branch, commitRes.sha)
  return !!refRes
}

/**
 * 递归 tree 被截断时，改用 Contents API 逐级收集目录下的所有文件
 * @param owner
 * @param repo
 * @param dirPath
 */
const collectDirBlobsByContents = async (
  owner: string,
  repo: string,
  dirPath: string,
): Promise<DirBlob[] | null> => {
  const blobs: DirBlob[] = []

  const walk = async (dir: string): Promise<boolean> => {
    const res: RepoContentItemInfo[] | null = await getRepoDirContent(owner, repo, dir)
    if (!res || !res.length) {
      return false
    }
    for (const item of res) {
      if (item.type === 'file') {
        blobs.push({ path: item.path, sha: item.sha, mode: '100644' })
      }
      else if (item.type === 'dir') {
        const subRes = await walk(item.path)
        if (!subRes) {
          return false
        }
      }
    }
    return true
  }

  return (await walk(dirPath)) ? blobs : null
}

/**
 * 获取远端指定目录下的所有文件（blob）
 * @param userConfigInfo
 * @param dirPath
 */
const getRemoteDirBlobs = async (
  userConfigInfo: UserConfigInfoModel,
  dirPath: string,
): Promise<DirBlob[] | null> => {
  const { owner, repo, branch } = userConfigInfo

  const headRes: GitBranchHeadInfo | null = await getBranchInfo(owner, repo, branch)
  if (!headRes) {
    return null
  }

  const headTreeSha = headRes.commit?.commit?.tree?.sha
  if (!headTreeSha) {
    return null
  }

  const treeRes: GitTreeObjectInfo | null = await getGitTreeRecursive(owner, repo, headTreeSha)
  if (!treeRes) {
    return null
  }

  // 目录内容过多导致递归 tree 被截断时，改用 Contents API 逐级收集
  if (treeRes.truncated) {
    return collectDirBlobsByContents(owner, repo, dirPath)
  }

  return treeRes.tree.filter(
    item => item.type === 'blob' && item.path.startsWith(`${dirPath}/`),
  )
}

/**
 * 重命名远端目录（重命名目录下所有文件路径，一次 commit 完成）
 * @param userConfigInfo
 * @param oldDirPath
 * @param newDirName
 */
export const renameDirOnGitHub = async (
  userConfigInfo: UserConfigInfoModel,
  oldDirPath: string,
  newDirName: string,
): Promise<boolean> => {
  const blobs = await getRemoteDirBlobs(userConfigInfo, oldDirPath)
  if (!blobs || !blobs.length) {
    return false
  }

  const entries: GitTreeEntry[] = []
  blobs.forEach(({ path, sha, mode }) => {
    const subPath = path.slice(oldDirPath.length)
    entries.push({ path: `${newDirName}${subPath}`, mode, type: 'blob', sha })
    entries.push({ path, sha: null })
  })

  const res = await commitTreeChanges(userConfigInfo, entries, PICX_RENAME_DIR_DESC)
  if (res) {
    store.dispatch('DIR_IMAGE_LIST_RENAME_DIR', { oldDirPath, newDirName })
  }
  return res
}

/**
 * 删除远端目录（删除目录下所有文件路径，一次 commit 完成）
 * @param userConfigInfo
 * @param dirPath
 */
export const deleteDirOnGitHub = async (
  userConfigInfo: UserConfigInfoModel,
  dirPath: string,
): Promise<boolean> => {
  const blobs = await getRemoteDirBlobs(userConfigInfo, dirPath)
  if (!blobs || !blobs.length) {
    return false
  }

  const entries: GitTreeEntry[] = blobs.map(({ path }) => ({ path, sha: null }))

  const res = await commitTreeChanges(userConfigInfo, entries, PICX_DEL_DIR_DESC)
  if (res) {
    store.dispatch('DIR_IMAGE_LIST_REMOVE_DIR_TREE', dirPath)
  }
  return res
}

/**
 * 移动远端图片到其他目录（一次 commit 完成）
 * @param userConfigInfo
 * @param img
 * @param newDir 目标目录路径，根目录传 '/'
 */
export const moveImageOnGitHub = async (
  userConfigInfo: UserConfigInfoModel,
  img: UploadedImageModel,
  newDir: string,
): Promise<boolean> => {
  const newPath = newDir === '/' ? img.name : `${newDir}/${img.name}`

  const entries: GitTreeEntry[] = [
    { path: newPath, mode: '100644', type: 'blob', sha: img.sha },
    { path: img.path, sha: null },
  ]

  const res = await commitTreeChanges(userConfigInfo, entries, PICX_MOVE_IMG_DESC)
  if (res) {
    store.dispatch('DIR_IMAGE_LIST_MOVE_IMAGE', { img, newDir })
  }
  return res
}
