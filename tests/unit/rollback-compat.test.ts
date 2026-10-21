import { createHash } from 'node:crypto'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { beforeEach, expect, it, vi } from 'vitest'
import { encodeSettingsBase64, parseCloudSettings } from '@/common/api/settings'
import { LS_CONFIG, LS_SETTINGS, SS_GLOBAL_SETTINGS } from '@/common/constant/storage'
import { pinia, store } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import readers from '../fixtures/rollback-readers.json'
import { createLegacySettingsFixture, createRepositoryFixture } from '../fixtures/ui-redesign'

vi.mock('@/utils/request', () => ({ default: vi.fn(), requestResult: vi.fn() }))

/** 快照附带提交与 blob 来源；浅克隆也能执行，不加载旧请求或用户配置。 */
function historicalReaders(id: string, names: string[], storage: Map<string, string>) {
  const snapshot = readers.snapshots.find(value => value.id === id)
  if (!snapshot)
    throw new Error('Historical snapshot missing')
  expect(createHash('sha256').update(snapshot.source).digest('hex')).toBe(snapshot.sha256)
  const file = ts.createSourceFile(snapshot.path, snapshot.source, ts.ScriptTarget.ES2022, true)
  const declarations = file.statements.filter(statement =>
    (ts.isFunctionDeclaration(statement) && statement.name && names.includes(statement.name.text))
    || (ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => ts.isIdentifier(declaration.name) && names.includes(declaration.name.text))),
  )
  expect(declarations).toHaveLength(names.length)
  const code = ts.transpileModule(declarations.map(statement => statement.getText(file)).join('\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports: Record<string, unknown> = {}
  const memoryStorage = { getItem: (key: string) => storage.get(key) ?? null }
  runInNewContext(code, {
    exports,
    window: { localStorage: memoryStorage, sessionStorage: memoryStorage, atob },
    TextDecoder,
    Uint8Array,
  }, { timeout: 1000, filename: `${id}/${snapshot.path}` })
  return exports
}

function invoke(reader: unknown, input: unknown): unknown {
  if (typeof reader !== 'function')
    throw new TypeError('Historical reader missing')
  return reader(input)
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  usePicxStore(pinia).$reset()
})

it.each(readers.boundaries)('回退到 $phase ($ref) 后读取新版保存的本地配置与 UTF-8 云偏好（T048）', async ({ storage: localSource, cloud: cloudSource }) => {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(createLegacySettingsFixture()))
  usePicxStore(pinia).$reset()
  await store.dispatch('USER_SETTINGS_PERSIST')
  const settings = JSON.parse(localStorage.getItem(LS_SETTINGS) ?? 'null')
  const repository = createRepositoryFixture()
  expect(repository.token).toBe('')
  const globalSettings = { language: 'zh-CN', theme: 'dark' }
  const storage = new Map([
    [LS_SETTINGS, JSON.stringify(settings)],
    [LS_CONFIG, JSON.stringify(repository)],
    [SS_GLOBAL_SETTINGS, JSON.stringify(globalSettings)],
  ])
  const local = historicalReaders(localSource.snapshot, ['getLocal', 'getSession'], storage)
  expect(invoke(local.getLocal, LS_SETTINGS)).toEqual(settings)
  expect(invoke(local.getLocal, LS_CONFIG)).toEqual(repository)
  expect(invoke(local.getSession, SS_GLOBAL_SETTINGS)).toEqual(globalSettings)
  const cloud = historicalReaders(cloudSource.snapshot, ['decodeBase64', 'parseCloudSettings'], storage)
  const payload = { sha: 'fixture-rollback', content: encodeSettingsBase64(JSON.stringify(settings)) }
  const rolledBack = invoke(cloud.parseCloudSettings, payload)
  expect(rolledBack).toEqual(settings)
  expect(parseCloudSettings({ ...payload, content: encodeSettingsBase64(JSON.stringify(rolledBack)) })).toEqual(settings)
  for (const key of ['token', 'manualToken', 'code', 'owner', 'repo'])
    expect(rolledBack).not.toHaveProperty(key)
})
