import type { CloudSettingsFileModel } from '../../src/common/api/settings'
import type { UserConfigInfoModel, UserSettingsModel } from '../../src/common/model'
import { CompressEncoderEnum, DirModeEnum, ImageSortEnum, WatermarkPositionEnum } from '../../src/common/model'

export const fixtureRepository = {
  owner: 'fixture-owner',
  repo: 'picx-images-hosting',
  branch: 'master',
} as const

/** 仅模拟已保存仓库，凭据始终为空，不代表连接验证成功。 */
export function createRepositoryFixture(): UserConfigInfoModel {
  return {
    ...fixtureRepository,
    token: '',
    id: '42',
    email: '',
    name: 'Fixture User',
    avatarUrl: '',
    dirMode: DirModeEnum.rootDir,
    viewDir: '/',
    selectedDir: '/',
    selectedDirList: [],
    dirList: [{ label: 'albums', value: 'albums' }, { label: 'empty', value: 'empty' }],
    logined: true,
    repoPrivate: false,
  }
}

interface LegacySettingsFixture {
  imageName: Pick<UserSettingsModel['imageName'], 'enableHash' | 'addPrefix'>
  compress: UserSettingsModel['compress']
  imageLinkType: UserSettingsModel['imageLinkType']
  imageLinkFormat: UserSettingsModel['imageLinkFormat']
  watermark: Omit<UserSettingsModel['watermark'], 'rotate' | 'gap'>
}

export function createLegacySettingsFixture(): LegacySettingsFixture {
  return {
    imageName: { enableHash: false, addPrefix: { enable: false, prefix: 'legacy-' } },
    compress: { enable: false, encoder: CompressEncoderEnum.mozJPEG },
    imageLinkType: {
      selected: 'Fixture CDN',
      presetList: {
        'Fixture CDN': {
          id: 'fixture-cdn',
          name: 'Fixture CDN',
          rule: 'https://images.example.test/{{owner}}/{{repo}}/{{branch}}/{{path}}',
          editable: true,
        },
      },
    },
    imageLinkFormat: {
      enable: false,
      selected: 'BBCode',
      presetList: [{ name: 'BBCode', format: '[img]imageLink[/img]' }],
    },
    watermark: {
      enable: true,
      text: '测试水印 PicX',
      fontSize: 32,
      position: WatermarkPositionEnum.rightBottom,
      textColor: '#FFFFFF',
      opacity: 0.4,
    },
  }
}

export function createSettingsFixture(): UserSettingsModel {
  const legacy = createLegacySettingsFixture()
  return {
    ...legacy,
    imageName: { ...legacy.imageName, enableTimestamp: false },
    watermark: { ...legacy.watermark, rotate: -20, gap: 80 },
    management: { sort: ImageSortEnum.default },
    deploy: { customDomain: '' },
    starred: false,
    showAnnouncement: false,
  }
}

export function createCloudSettingsFixture(settings: object = createSettingsFixture()): CloudSettingsFileModel {
  const bytes = new TextEncoder().encode(JSON.stringify(settings))
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return { sha: 'fixture-settings-sha', content: btoa(binary) }
}

interface RepoContentFixture {
  type: 'dir' | 'file'
  name: string
  path: string
  sha: string
  size: number
}

export type DirectoryScenario = 'empty' | 'folders' | 'mixed'

export function createDirectoryContentsFixture(scenario: DirectoryScenario = 'mixed'): Record<string, RepoContentFixture[]> {
  const folders: RepoContentFixture[] = ['albums', 'empty'].map(name => ({
    type: 'dir',
    name,
    path: name,
    sha: `fixture-${name}-sha`,
    size: 0,
  }))
  const rootImage: RepoContentFixture = {
    type: 'file',
    name: 'coast.png',
    path: 'coast.png',
    sha: 'fixture-coast-sha',
    size: 1024,
  }
  return {
    '': scenario === 'empty' ? [] : scenario === 'folders' ? folders : [...folders, rootImage],
    'empty': [],
    'albums': [
      { type: 'file', name: 'lake.png', path: 'albums/lake.png', sha: 'fixture-lake-sha', size: 2048 },
      { type: 'file', name: 'clip.mp4', path: 'albums/clip.mp4', sha: 'fixture-video-sha', size: 4096 },
    ],
  }
}

export type FailureScenario = 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict' | 'rate-limited' | 'service'

export function createFailureFixture(scenario: FailureScenario) {
  const statuses: Record<FailureScenario, number> = {
    'unauthenticated': 401,
    'forbidden': 403,
    'not-found': 404,
    'conflict': 409,
    'rate-limited': 429,
    'service': 503,
  }
  return { status: statuses[scenario], json: { message: `Fixture ${scenario}` } }
}

/** 后续 T026 用于验证 blob 部分失败与 ref 失败，数据不冒充上传领域结果。 */
export function createPartialUploadFixture() {
  return {
    target: { ...fixtureRepository, dir: 'albums' },
    items: [
      { uuid: 'fixture-upload-a', name: 'lake.png', bytes: 2048 },
      { uuid: 'fixture-upload-b', name: 'coast.png', bytes: 1024 },
    ],
    blobResponses: [
      { status: 201, json: { sha: 'fixture-blob-a' } },
      createFailureFixture('forbidden'),
    ],
    refSuccess: { status: 200, json: { object: { sha: 'fixture-commit-sha' } } },
    refFailure: createFailureFixture('conflict'),
  }
}

// 固定 1px PNG，仅用作拦截后的媒体响应，不访问外域。
export const fixturePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP9sAAAAASUVORK5CYII='
