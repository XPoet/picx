import type { RepositoryIdentity } from '@/common/model/github-connection'
import { NEW_DIR_COUNT_MAX } from '@/common/constant'
import { DirModeEnum } from '@/common/model/user-config'

export interface UploadDirectoryDraft {
  mode: DirModeEnum
  segments: string[]
  inputPath: string
}

export interface UploadDirectoryValue {
  dirMode: DirModeEnum
  selectedDir: string
  selectedDirList: string[]
}

export type DirectoryPathError = 'empty' | 'empty-segment' | 'dot-segment' | 'backslash' | 'depth' | 'control'
export type DirectoryValidation
  = | { ok: true, value: UploadDirectoryValue }
    | { ok: false, error: DirectoryPathError, field: 'inputPath' | 'segments' }
export type DirectorySaveResult
  = | { ok: true, value: UploadDirectoryValue }
    | { ok: false, reason: 'invalid-path' | 'upload-busy' | 'storage-unavailable', field?: 'inputPath' | 'segments' }

export interface UploadTargetSnapshot extends RepositoryIdentity {
  readonly dir: string
  readonly resolvedAt: number
}

export function localDateDirectory(now: Date): string {
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}

export function displayDirectory(path: string): string {
  return !path || path === '/' ? '/' : `/${path.replace(/^\//, '')}`
}

export function directoryDraft(value: UploadDirectoryValue): UploadDirectoryDraft {
  return {
    mode: value.dirMode,
    segments: [...value.selectedDirList],
    inputPath: value.selectedDir === '/' ? '' : value.selectedDir,
  }
}

export function validateDirectoryDraft(draft: UploadDirectoryDraft, now = new Date()): DirectoryValidation {
  if (draft.mode === DirModeEnum.rootDir) {
    return { ok: true, value: { dirMode: draft.mode, selectedDir: '/', selectedDirList: [] } }
  }
  if (draft.mode === DirModeEnum.dateDir) {
    const date = localDateDirectory(now)
    return { ok: true, value: { dirMode: draft.mode, selectedDir: date, selectedDirList: [date] } }
  }
  const field = draft.mode === DirModeEnum.repoDir ? 'segments' : 'inputPath'
  const path = field === 'segments' ? draft.segments.join('/') : draft.inputPath.trim().replace(/^\//, '').replace(/\/$/, '')
  const segments = path.split('/')
  let error: DirectoryPathError | undefined
  if (!path)
    error = 'empty'
  else if (segments.some(segment => !segment))
    error = 'empty-segment'
  else if (segments.some(segment => segment === '.' || segment === '..'))
    error = 'dot-segment'
  else if (path.includes('\\'))
    error = 'backslash'
  else if (segments.length > NEW_DIR_COUNT_MAX)
    error = 'depth'
  else if ([...path].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
    error = 'control'
  if (error)
    return { ok: false, error, field }
  // 仓库分段本身不可含分隔符，防止与预览拼接结果产生歧义。
  if (field === 'segments' && (draft.segments.some(segment => segment.includes('/')) || !Object.values(DirModeEnum).includes(draft.mode))) {
    return { ok: false, error: 'empty-segment', field }
  }
  return { ok: true, value: { dirMode: draft.mode, selectedDir: path, selectedDirList: segments } }
}

export function resolveUploadTarget(config: RepositoryIdentity & UploadDirectoryValue, now = new Date()): UploadTargetSnapshot {
  return Object.freeze({
    owner: config.owner,
    repo: config.repo,
    branch: config.branch,
    dir: config.dirMode === DirModeEnum.dateDir ? localDateDirectory(now) : config.selectedDir,
    resolvedAt: now.getTime(),
  })
}

export const directoryQueryKey = (segments: readonly string[]) => segments.join('/') || '/'
