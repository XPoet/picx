import type { ConnectionResult } from '@/common/model/github-connection'
import type { UserConfigInfoModel } from '@/common/model/user-config'
import {
  createConnectionRepository,
  getConnectionBranches,
  getConnectionInstallations,
  getConnectionRepository,
  initializeConnectionRepository,
  verifyConnectionBranch,
  verifyGitHubAccount,
} from '@/common/api/connection'
import { INIT_REPO_BARNCH, INIT_REPO_NAME } from '@/common/constant'

export interface ConnectionInput {
  token: string
  mode: 'token' | 'oauth'
  previous: Pick<UserConfigInfoModel, 'owner' | 'repo' | 'branch'>
}

/** 服务不持有 Store、路由或凭据副本；写入前检查本次尝试仍有效。 */
export async function connectGitHub(
  input: ConnectionInput,
  onStep: (step: 'user' | 'repository' | 'branch') => void,
  isCurrent: () => boolean,
): Promise<ConnectionResult> {
  const stale = (): ConnectionResult => ({ ok: false, error: { kind: 'initialization-failed', retryable: true } })
  if (!input.token.trim()) {
    return { ok: false, error: { kind: 'unauthenticated', retryable: false } }
  }
  onStep('user')
  const account = await verifyGitHubAccount(input.token)
  if (!account.ok) {
    return account
  }
  if (!isCurrent()) {
    return stale()
  }
  if (input.mode === 'oauth') {
    const installations = await getConnectionInstallations(input.token)
    if (!installations.ok) {
      return installations
    }
    if (!installations.data.installations.length) {
      return { ok: false, error: { kind: 'app-not-installed', retryable: true } }
    }
  }
  const owner = account.data.login
  const reuseDirectory = input.previous.owner === owner && Boolean(input.previous.repo)
  const repo = reuseDirectory ? input.previous.repo : INIT_REPO_NAME
  onStep('repository')
  let repository = await getConnectionRepository(input.token, owner, repo)
  if (!isCurrent()) {
    return stale()
  }
  if (!repository.ok && repository.error.kind === 'not-found' && !reuseDirectory) {
    repository = await createConnectionRepository(input.token, repo)
    // 两个入口同时初始化同一仓库时，创建冲突只能重新查询，不能冒充创建成功。
    if (!repository.ok && repository.error.status === 422) {
      repository = await getConnectionRepository(input.token, owner, repo)
    }
  }
  if (!repository.ok) {
    return repository
  }
  if (repository.data.permissions?.push === false) {
    return { ok: false, error: { kind: 'forbidden', status: 403, retryable: false } }
  }
  const branch = reuseDirectory && input.previous.branch
    ? input.previous.branch
    : repository.data.default_branch || INIT_REPO_BARNCH
  onStep('branch')
  let verified = await verifyConnectionBranch(input.token, owner, repo, branch)
  if (!verified.ok && verified.error.kind === 'not-found') {
    const branches = await getConnectionBranches(input.token, owner, repo)
    if (!branches.ok) {
      return branches
    }
    if (!branches.data.length && isCurrent()) {
      const initialized = await initializeConnectionRepository(input.token, owner, repo, branch)
      if (!initialized.ok) {
        return initialized
      }
      verified = await verifyConnectionBranch(input.token, owner, repo, branch)
    }
  }
  if (!verified.ok) {
    return verified
  }
  if (!isCurrent()) {
    return stale()
  }
  return {
    ok: true,
    data: { account: account.data, repository: { owner, repo, branch }, visibility: repository.data.private ? 'private' : 'public', reuseDirectory },
  }
}
