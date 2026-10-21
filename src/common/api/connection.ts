import type { GitHubAccount } from '@/common/model/github-connection'
import { INIT_REPO_DESC, PICX_INIT_REPO_MSG } from '@/common/constant'
import { requestResult } from '@/utils/request'

interface RepositoryDetails {
  name: string
  private: boolean
  default_branch: string
  owner: { login: string }
  permissions?: { push?: boolean }
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'

function isAccount(value: unknown): value is GitHubAccount {
  return isRecord(value) && typeof value.id === 'number' && typeof value.login === 'string'
    && (value.name === null || typeof value.name === 'string')
    && (value.email === null || typeof value.email === 'string') && typeof value.avatar_url === 'string'
}

function isRepository(value: unknown): value is RepositoryDetails {
  return isRecord(value) && typeof value.name === 'string' && typeof value.private === 'boolean'
    && typeof value.default_branch === 'string' && isRecord(value.owner) && typeof value.owner.login === 'string'
    && (value.permissions === undefined || (isRecord(value.permissions)
      && (value.permissions.push === undefined || typeof value.permissions.push === 'boolean')))
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })
const repoURL = (owner: string, repo: string) => `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`

export function verifyGitHubAccount(token: string) {
  return requestResult({ url: '/user', method: 'GET', headers: auth(token), noCache: true }, isAccount)
}

export function getConnectionRepository(token: string, owner: string, repo: string) {
  return requestResult({ url: repoURL(owner, repo), method: 'GET', headers: auth(token), noCache: true }, isRepository)
}

export function createConnectionRepository(token: string, repo: string) {
  return requestResult({
    url: '/user/repos',
    method: 'POST',
    headers: auth(token),
    data: { name: repo, description: INIT_REPO_DESC, private: false },
  }, isRepository)
}

export function getConnectionBranches(token: string, owner: string, repo: string) {
  return requestResult({
    url: `${repoURL(owner, repo)}/branches`,
    method: 'GET',
    headers: auth(token),
    noCache: true,
    params: { per_page: 100 },
  }, (value): value is { name: string }[] => Array.isArray(value) && value.every(item => isRecord(item) && typeof item.name === 'string'))
}

export function verifyConnectionBranch(token: string, owner: string, repo: string, branch: string) {
  return requestResult({
    url: `${repoURL(owner, repo)}/branches/${encodeURIComponent(branch)}`,
    method: 'GET',
    headers: auth(token),
    noCache: true,
  }, (value): value is { name: string } => isRecord(value) && value.name === branch)
}

export function getConnectionInstallations(token: string) {
  return requestResult({ url: '/user/installations', method: 'GET', headers: auth(token), noCache: true }, (value): value is { installations: { id: number }[] } => isRecord(value) && Array.isArray(value.installations)
    && value.installations.every(item => isRecord(item) && typeof item.id === 'number'))
}

export function initializeConnectionRepository(token: string, owner: string, repo: string, branch: string) {
  return requestResult({
    url: `${repoURL(owner, repo)}/contents/README.md`,
    method: 'PUT',
    headers: auth(token),
    data: {
      branch,
      message: PICX_INIT_REPO_MSG,
      content: btoa('# Welcome to use PicX\n\n[PicX](https://github.com/XPoet/picx) is a free, open source image hosting tool using GitHub repositories.\n'),
    },
  }, (value): value is { commit: { sha: string } } => isRecord(value) && isRecord(value.commit) && typeof value.commit.sha === 'string')
}
