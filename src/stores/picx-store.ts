import type {
  ImageLinkRuleModel,
  ImgProcessStateModel,
  UploadedImageModel,
  UploadImageModel,
  UserConfigInfoModel,
  UserSettingsModel,
} from '@/common/model'
import type { ConnectedRepository, ConnectionState } from '@/common/model/github-connection'
import type { QueueItemRuntime, UploadBatchResult } from '@/common/model/upload'
import type DeployStatusInfo from '@/stores/modules/deploy-status/types'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import type { GitHubAuthorizationInfo } from '@/stores/modules/github-authorize/types'
import type UploadAreaStateTypes from '@/stores/modules/upload-area/types'
import type { GlobalSettingsModel } from '@/stores/modules/user-settings/types'
import type { DirectorySaveResult, UploadDirectoryValue } from '@/utils/directory-utils'
import type { SettingsPayload } from '@/utils/settings-payload'
import type { UploadPreferencesPatch } from '@/utils/upload-preferences'
import { defineStore } from 'pinia'
import {
  LS_AUTHORIZATION,
  LS_CONFIG,
  LS_MANAGEMENT,
  LS_SETTINGS,
  SS_GLOBAL_SETTINGS,
} from '@/common/constant'
import {
  CompressEncoderEnum,
  DirModeEnum,
  ElementPlusSizeEnum,
  ImageLinkTypeEnum,
  ImageSortEnum,
  ThemeModeEnum,
  WatermarkPositionEnum,
} from '@/common/model'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import i18n from '@/plugins/vue/i18n'
import {
  createDirObject,
  getDirContent,
  getUpLevelDirList,
  getUpOneLevelDir,
} from '@/stores/modules/dir-image-list/utils'
import { ImgLinkRuleActionsEnum } from '@/stores/modules/user-settings/types'
import { imgLinkRuleVerification } from '@/stores/modules/user-settings/utils'
import { localSettingsFailed, localSettingsSaved } from '@/stores/settings-sync-state'
import {
  cleanObject,
  deepAssignObject,
  formatDatetime,
  getLocal,
  getSession,
  getUuid,
  setLocal,
  setSession,
} from '@/utils'
import { directoryDraft, validateDirectoryDraft } from '@/utils/directory-utils'
import { validateLinkRule } from '@/utils/link-rule-validation'
import { mergeSettings, projectSettings, readSettingsPayload } from '@/utils/settings-payload'
import { getBrowserLanguage } from '@/utils/system'
import { validUploadPreferences } from '@/utils/upload-preferences'

interface PicxState {
  connection: ConnectionState
  connectionAttemptId: number
  connectionSessionId: number
  uploadTargetBusy: boolean
  uploadRuntime: Record<string, QueueItemRuntime>
  uploadBatches: UploadBatchResult[]
  rootName: string
  githubAuthorizeModule: {
    authorizationInfo: GitHubAuthorizationInfo
  }
  userConfigInfoModule: {
    userConfigInfo: UserConfigInfoModel
  }
  userSettingsModule: {
    userSettings: UserSettingsModel
    globalSettings: GlobalSettingsModel
  }
  dirImageListModule: {
    name: string
    dirObject: DirObject
  }
  imageCardModule: {
    imgCardArr: UploadedImageModel[]
  }
  uploadAreaModule: UploadAreaStateTypes
  toolboxImageListModule: {
    toolboxImageList: ImgProcessStateModel[]
  }
  uploadImageListModule: {
    uploadImageList: UploadImageModel[]
  }
  deployStatusModule: DeployStatusInfo
}

/**
 * 只把源对象中已存在于目标对象的属性写入目标对象。
 */
function assignKnownProperties<T extends object>(target: T, source: Partial<T>): void {
  Object.entries(source).forEach(([key, value]) => {
    if (Object.hasOwn(target, key)) {
      Reflect.set(target, key, value)
    }
  })
}

/**
 * 创建默认 GitHub 授权信息。
 */
function createAuthorizationInfo(): GitHubAuthorizationInfo {
  const authorizationInfo: GitHubAuthorizationInfo = {
    authorized: false,
    installed: null,
    token: '',
    tokenCreateTime: 0,
    code: '',
    codeCreateTime: 0,
    installationId: '',
    manualToken: '',
    isAutoAuthorize: false,
    authorizing: false,
  }
  const storedAuthorizationInfo = getLocal(
    LS_AUTHORIZATION,
  ) as Partial<GitHubAuthorizationInfo> | null

  if (storedAuthorizationInfo) {
    deepAssignObject(authorizationInfo, storedAuthorizationInfo)
  }

  if (authorizationInfo.code || authorizationInfo.codeCreateTime) {
    authorizationInfo.code = ''
    authorizationInfo.codeCreateTime = 0
    try {
      setLocal(LS_AUTHORIZATION, authorizationInfo)
    }
    catch {}
  }
  return authorizationInfo
}

/**
 * 创建默认用户配置。
 */
function createUserConfigInfo(): UserConfigInfoModel {
  const userConfigInfo: UserConfigInfoModel = {
    token: '',
    id: '',
    owner: '',
    email: '',
    name: '',
    avatarUrl: '',
    repo: '',
    branch: '',
    selectedDir: '',
    dirMode: DirModeEnum.repoDir,
    dirList: [],
    logined: false,
    selectedDirList: [],
    viewDir: '',
    repoPrivate: false,
  }
  const storedConfig = localStorage.getItem(LS_CONFIG)

  if (storedConfig) {
    deepAssignObject(userConfigInfo, JSON.parse(storedConfig) as Partial<UserConfigInfoModel>)

    if (userConfigInfo.dirMode === DirModeEnum.dateDir) {
      userConfigInfo.selectedDir = formatDatetime('yyyyMMdd')
    }
  }

  return userConfigInfo
}

/**
 * 创建默认用户设置。
 */
function createDefaultUserSettings(): UserSettingsModel {
  return {
    imageName: {
      enableHash: true,
      enableTimestamp: false,
      addPrefix: { enable: false, prefix: '' },
    },
    compress: {
      enable: true,
      encoder: CompressEncoderEnum.original,
    },
    management: {
      sort: ImageSortEnum.default,
    },
    imageLinkType: {
      selected: ImageLinkTypeEnum.GitHub,
      presetList: {
        [ImageLinkTypeEnum.GitHubPages]: {
          id: getUuid(),
          name: ImageLinkTypeEnum.GitHubPages,
          rule: 'https://{{owner}}.github.io/{{repo}}/{{path}}',
        },
        [ImageLinkTypeEnum.GitHub]: {
          id: getUuid(),
          name: ImageLinkTypeEnum.GitHub,
          rule: 'https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}',
        },
        [ImageLinkTypeEnum.jsDelivr]: {
          id: getUuid(),
          name: ImageLinkTypeEnum.jsDelivr,
          rule: 'https://cdn.jsdelivr.net/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}',
        },
        [ImageLinkTypeEnum.Statically]: {
          id: getUuid(),
          name: ImageLinkTypeEnum.Statically,
          rule: 'https://cdn.statically.io/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}',
        },
        [ImageLinkTypeEnum.ChinaJsDelivr]: {
          id: getUuid(),
          name: ImageLinkTypeEnum.ChinaJsDelivr,
          rule: 'https://jsd.cdn.zzko.cn/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}',
        },
      },
    },
    imageLinkFormat: {
      enable: false,
      selected: 'Markdown',
      presetList: [
        {
          name: 'Markdown',
          format: '![imageName](imageLink)',
        },
        {
          name: 'HTML',
          format: '<img src="imageLink" alt="imageName" />',
        },
        {
          name: 'BBCode',
          format: '[img]imageLink[/img]',
        },
      ],
    },
    starred: false,
    deploy: {
      customDomain: '',
    },
    watermark: {
      enable: false,
      text: 'PicX',
      fontSize: 50,
      position: WatermarkPositionEnum.rightBottom,
      textColor: '#FFFFFF',
      opacity: 0.5,
      rotate: -20,
      gap: 80,
    },
    showAnnouncement: true,
  }
}

/**
 * 创建持久化后的用户设置。
 */
function createUserSettings(): UserSettingsModel {
  const defaults = createDefaultUserSettings()
  try {
    const stored: unknown = getLocal(LS_SETTINGS)
    const payload = readSettingsPayload(stored)
    return payload ? mergeSettings(defaults, payload) : defaults
  }
  catch { return defaults }
}

/**
 * 创建全局界面设置。
 */
function createGlobalSettings(): GlobalSettingsModel {
  const globalSettings: GlobalSettingsModel = {
    showAnnouncement: true,
    folded: false,
    elementPlusSize: ElementPlusSizeEnum.default,
    language: getBrowserLanguage(),
    theme: ThemeModeEnum.system,
  }
  const storedSettings = getSession(SS_GLOBAL_SETTINGS) as Partial<GlobalSettingsModel> | null

  if (storedSettings) {
    deepAssignObject(globalSettings, storedSettings)
  }

  return globalSettings
}

/**
 * 创建图片管理目录树。
 */
function createDirectoryTree(): DirObject {
  const storedDirectoryTree = localStorage.getItem(LS_MANAGEMENT)
  return storedDirectoryTree
    ? (JSON.parse(storedDirectoryTree) as DirObject)
    : createDirObject('/', '/')
}

/**
 * PicX 的 Pinia 兼容 Store。
 *
 * 第一阶段保留旧 Vuex 的模块状态形状和 action 名称，页面无需同步重写。
 */
export const usePicxStore = defineStore('picx', {
  state: (): PicxState => ({
    rootName: 'root',
    connection: { phase: 'disconnected' },
    connectionAttemptId: 0,
    connectionSessionId: 0,
    uploadTargetBusy: false,
    uploadRuntime: {},
    uploadBatches: [],
    githubAuthorizeModule: {
      authorizationInfo: createAuthorizationInfo(),
    },
    userConfigInfoModule: {
      userConfigInfo: createUserConfigInfo(),
    },
    userSettingsModule: {
      userSettings: createUserSettings(),
      globalSettings: createGlobalSettings(),
    },
    dirImageListModule: {
      name: 'dirImageListModule',
      dirObject: createDirectoryTree(),
    },
    imageCardModule: {
      imgCardArr: [],
    },
    uploadAreaModule: {
      isActive: false,
      isPaste: false,
      pressShiftKey: false,
      activeInfo: null,
      isShowMoveImageDialog: false,
      moveImageInfo: null,
    },
    toolboxImageListModule: {
      toolboxImageList: [],
    },
    uploadImageListModule: {
      uploadImageList: [],
    },
    deployStatusModule: {
      github: {
        uuid: getUuid(),
        status: null,
        latestTime: null,
        type: DeployServerEnum.githubPages,
      },
    },
  }),

  getters: {
    getGitHubAuthorizationInfo: state => state.githubAuthorizeModule.authorizationInfo,
    getUserLoginStatus: state => state.userConfigInfoModule.userConfigInfo.logined,
    getUserConfigInfo: state => state.userConfigInfoModule.userConfigInfo,
    getUserViewDir: state => state.userConfigInfoModule.userConfigInfo.viewDir,
    getUserSettings: state => state.userSettingsModule.userSettings,
    getGlobalSettings: state => state.userSettingsModule.globalSettings,
    getDirObject: state => state.dirImageListModule.dirObject,
    getImageCardArr: state => state.imageCardModule.imgCardArr,
    getImageCardCheckedArr: state =>
      state.imageCardModule.imgCardArr.filter(image => image.checked),
    getUploadAreaState: state => state.uploadAreaModule,
    getToolboxImageList: state => state.toolboxImageListModule.toolboxImageList,
    getUploadImageList: state => state.uploadImageListModule.uploadImageList,
    getDeployStatusInfo: state => state.deployStatusModule,
  },

  actions: {
    SAVE_UPLOAD_DIRECTORY(value: UploadDirectoryValue): DirectorySaveResult {
      if (this.uploadTargetBusy || this.getUploadImageList.some(image => image.uploadStatus.uploading)) {
        return { ok: false, reason: 'upload-busy' }
      }
      const validated = validateDirectoryDraft(directoryDraft(value))
      if (!validated.ok || validated.value.selectedDir !== value.selectedDir
        || JSON.stringify(validated.value.selectedDirList) !== JSON.stringify(value.selectedDirList)) {
        return { ok: false, reason: 'invalid-path' }
      }
      const candidate = { ...this.userConfigInfoModule.userConfigInfo, ...value, selectedDirList: [...value.selectedDirList] }
      try {
        localStorage.setItem(LS_CONFIG, JSON.stringify(candidate))
      }
      catch {
        return { ok: false, reason: 'storage-unavailable' }
      }
      Object.assign(this.userConfigInfoModule.userConfigInfo, value, { selectedDirList: [...value.selectedDirList] })
      return { ok: true, value: { ...value, selectedDirList: [...value.selectedDirList] } }
    },
    BEGIN_GITHUB_CONNECTION() {
      this.connectionAttemptId += 1
      this.connection = { phase: 'validating', attemptId: this.connectionAttemptId }
      return this.connectionAttemptId
    },

    COMMIT_GITHUB_CONNECTION(attemptId: number, token: string, mode: 'token' | 'oauth', result: ConnectedRepository): boolean {
      if (attemptId !== this.connectionAttemptId) {
        return false
      }
      const previous = this.userConfigInfoModule.userConfigInfo
      const config: UserConfigInfoModel = {
        ...previous,
        token,
        logined: true,
        id: String(result.account.id),
        owner: result.account.login,
        name: result.account.name ?? '',
        email: result.account.email ?? '',
        avatarUrl: result.account.avatar_url,
        repo: result.repository.repo,
        branch: result.repository.branch,
        repoPrivate: result.visibility === 'private',
        ...(result.reuseDirectory ? {} : { dirMode: DirModeEnum.rootDir, selectedDir: '/', selectedDirList: [], dirList: [], viewDir: '' }),
      }
      const authorization: GitHubAuthorizationInfo = {
        ...this.githubAuthorizeModule.authorizationInfo,
        code: '',
        codeCreateTime: 0,
        authorizing: false,
        isAutoAuthorize: mode === 'oauth',
        ...(mode === 'oauth'
          ? { authorized: true, installed: true, token, tokenCreateTime: Date.now() }
          : { authorized: false, installed: null, token: '', tokenCreateTime: 0, manualToken: token }),
      }
      const changedSession = !previous.logined || previous.token !== token || previous.owner !== result.repository.owner || previous.repo !== result.repository.repo || previous.branch !== result.repository.branch
      const changedRepository = Boolean(previous.owner) && (previous.owner !== result.repository.owner || previous.repo !== result.repository.repo || previous.branch !== result.repository.branch)
      const emptyTree = changedRepository ? createDirObject('/', '/') : null
      const oldManagement = changedRepository ? localStorage.getItem(LS_MANAGEMENT) : null
      const oldConfig = localStorage.getItem(LS_CONFIG)
      const oldAuthorization = localStorage.getItem(LS_AUTHORIZATION)
      try {
        localStorage.setItem(LS_CONFIG, JSON.stringify(config))
        localStorage.setItem(LS_AUTHORIZATION, JSON.stringify(authorization))
        if (emptyTree)
          localStorage.setItem(LS_MANAGEMENT, JSON.stringify(emptyTree))
      }
      catch {
        // 尽力恢复原快照；即使存储完全不可用也不发布候选内存状态。
        try {
          if (oldConfig === null)
            localStorage.removeItem(LS_CONFIG)
          else localStorage.setItem(LS_CONFIG, oldConfig)
          if (oldAuthorization === null)
            localStorage.removeItem(LS_AUTHORIZATION)
          else localStorage.setItem(LS_AUTHORIZATION, oldAuthorization)
          if (changedRepository) {
            if (oldManagement === null)
              localStorage.removeItem(LS_MANAGEMENT)
            else localStorage.setItem(LS_MANAGEMENT, oldManagement)
          }
        }
        catch {}
        this.connection = { phase: 'failed', attemptId, error: { kind: 'storage-unavailable', retryable: true } }
        return false
      }
      if (emptyTree) {
        this.dirImageListModule.dirObject = emptyTree
        this.imageCardModule.imgCardArr = []
        this.UPLOAD_IMG_LIST_RESET()
        this.UPLOAD_AREA_ACTIVE_LOGOUT()
      }
      Object.assign(previous, config)
      Object.assign(this.githubAuthorizeModule.authorizationInfo, authorization)
      if (changedSession)
        this.connectionSessionId += 1
      this.connection = { phase: 'connected', attemptId, repository: result.repository, visibility: result.visibility, verifiedAt: Date.now() }
      return true
    },
    SET_GITHUB_AUTHORIZATION_INFO(authorizationInfo: Partial<GitHubAuthorizationInfo>) {
      assignKnownProperties(this.githubAuthorizeModule.authorizationInfo, authorizationInfo)
      this.GITHUB_AUTHORIZATION_INFO_PERSIST()
    },

    GITHUB_AUTHORIZATION_INFO_PERSIST() {
      setLocal(LS_AUTHORIZATION, this.githubAuthorizeModule.authorizationInfo)
    },

    USER_CONFIG_INFO_RESET() {
      this.userConfigInfoModule.userConfigInfo = createUserConfigInfo()
    },

    SET_USER_CONFIG_INFO(configInfo: Partial<UserConfigInfoModel>) {
      assignKnownProperties(this.userConfigInfoModule.userConfigInfo, configInfo)
      this.USER_CONFIG_INFO_PERSIST()
    },

    USER_CONFIG_INFO_ADD_DIR(directory: string) {
      const directoryList = this.userConfigInfoModule.userConfigInfo.dirList

      if (!directoryList.some(item => item.value === directory)) {
        directoryList.push({ label: directory, value: directory })
        this.USER_CONFIG_INFO_PERSIST()
      }
    },

    USER_CONFIG_INFO_REMOVE_DIR(directory: string) {
      const directoryList = this.userConfigInfoModule.userConfigInfo.dirList
      const removeIndex = directoryList.findIndex(item => item.value === directory)

      if (removeIndex !== -1) {
        directoryList.splice(removeIndex, 1)
        this.USER_CONFIG_INFO_PERSIST()
      }
    },

    USER_CONFIG_INFO_PERSIST() {
      localStorage.setItem(LS_CONFIG, JSON.stringify(this.userConfigInfoModule.userConfigInfo))
    },

    USER_CONFIG_INFO_LOGOUT() {
      this.connectionSessionId += 1
      cleanObject(this.userConfigInfoModule.userConfigInfo)
    },

    SAVE_UPLOAD_PREFERENCES(patch: UploadPreferencesPatch): boolean {
      if (this.uploadTargetBusy)
        return false
      const candidate = { ...this.getUserSettings, ...patch }
      if (!validUploadPreferences(candidate))
        return false
      return this.SAVE_SETTINGS_CANDIDATE(patch)
    },

    SET_USER_SETTINGS(settingsInfo: SettingsPayload): boolean {
      return this.SAVE_SETTINGS_CANDIDATE(mergeSettings(this.getUserSettings, settingsInfo))
    },

    SET_GLOBAL_SETTINGS(globalSettings: Partial<GlobalSettingsModel>) {
      assignKnownProperties(this.userSettingsModule.globalSettings, globalSettings)
      setSession(SS_GLOBAL_SETTINGS, this.userSettingsModule.globalSettings)
    },

    SAVE_IMAGE_LINK_RULE(rule: ImageLinkRuleModel, originalName?: string): boolean {
      const current = this.getUserSettings.imageLinkType
      const previous = originalName ? current.presetList[originalName] : undefined
      if ((originalName && !previous) || (previous && !previous.editable) || validateLinkRule(rule, current.presetList, originalName))
        return false
      const rules = { ...current.presetList }
      if (originalName)
        delete rules[originalName]
      const candidate = { ...rule, name: rule.name.trim(), rule: rule.rule.trim(), editable: previous ? previous.editable : true }
      rules[candidate.name] = candidate
      return this.SAVE_LINK_PREFERENCES({ ...current, presetList: rules, selected: current.selected === originalName ? candidate.name : current.selected })
    },

    REMOVE_IMAGE_LINK_RULE(rule: ImageLinkRuleModel): boolean {
      const current = this.getUserSettings.imageLinkType
      if (!current.presetList[rule.name]?.editable)
        return false
      const rules = { ...current.presetList }
      delete rules[rule.name]
      const selected = current.selected === rule.name ? (rules[ImageLinkTypeEnum.GitHub] ? ImageLinkTypeEnum.GitHub : Object.keys(rules)[0]) : current.selected
      return Boolean(selected) && this.SAVE_LINK_PREFERENCES({ selected, presetList: rules })
    },

    SAVE_LINK_PREFERENCES(imageLinkType: UserSettingsModel['imageLinkType']): boolean {
      if (!Object.hasOwn(imageLinkType.presetList, imageLinkType.selected))
        return false
      return this.SAVE_SETTINGS_CANDIDATE({ imageLinkType })
    },

    SAVE_SETTINGS_CANDIDATE(patch: Partial<UserSettingsModel>): boolean {
      const candidate = projectSettings({ ...this.getUserSettings, ...patch })
      try {
        setLocal(LS_SETTINGS, candidate)
      }
      catch {
        localSettingsFailed(() => this.SAVE_SETTINGS_CANDIDATE(patch))
        return false
      }
      assignKnownProperties(this.userSettingsModule.userSettings, candidate)
      localSettingsSaved()
      return true
    },

    ADD_IMAGE_LINK_TYPE_RULE({ rule }: { rule: ImageLinkRuleModel }) {
      const presetRules = this.userSettingsModule.userSettings.imageLinkType.presetList

      if (Object.hasOwn(presetRules, rule.name)) {
        ElMessage.error(i18n.global.t('settings_page.link_rule.error_msg_1'))
        return
      }

      imgLinkRuleVerification(rule, ImgLinkRuleActionsEnum.add, (verified: boolean) => {
        if (verified) {
          presetRules[rule.name] = rule
          this.USER_SETTINGS_PERSIST()
        }
      })
    },

    UPDATE_IMAGE_LINK_TYPE_RULE({ rule }: { rule: ImageLinkRuleModel }) {
      if (!this.getUserSettings.imageLinkType.presetList[rule.name]?.editable)
        return
      imgLinkRuleVerification(rule, ImgLinkRuleActionsEnum.edit, (verified: boolean) => {
        if (verified) {
          this.userSettingsModule.userSettings.imageLinkType.presetList[rule.name].rule = rule.rule
          this.USER_SETTINGS_PERSIST()
        }
      })
    },

    DEL_IMAGE_LINK_TYPE_RULE(rule: ImageLinkRuleModel) {
      delete this.userSettingsModule.userSettings.imageLinkType.presetList[rule.name]
      this.USER_SETTINGS_PERSIST()
    },

    USER_SETTINGS_PERSIST() {
      return this.SAVE_SETTINGS_CANDIDATE({})
    },

    USER_GLOBAL_PERSIST() {
      setSession(SS_GLOBAL_SETTINGS, this.userSettingsModule.globalSettings)
    },

    USER_SETTINGS_LOGOUT() {
      this.userSettingsModule.userSettings = createDefaultUserSettings()
    },

    DIR_IMAGE_LIST_ADD_DIR(directoryPath: string) {
      if (directoryPath === '/') {
        return
      }

      const findOrCreateDirectory = (
        parentDirectory: DirObject,
        directory: string,
        currentPath: string,
      ): DirObject => {
        let targetDirectory = parentDirectory.childrenDirs.find(item => item.dir === directory)

        if (!targetDirectory) {
          targetDirectory = createDirObject(directory, currentPath)
          parentDirectory.childrenDirs.push(targetDirectory)
        }

        return targetDirectory
      }

      let currentDirectory = this.dirImageListModule.dirObject
      let currentPath = ''

      directoryPath.split('/').forEach((directory, index) => {
        currentPath += `${index > 0 ? '/' : ''}${directory}`
        currentDirectory = findOrCreateDirectory(currentDirectory, directory, currentPath)

        if (index === 0) {
          this.USER_CONFIG_INFO_ADD_DIR(directory)
        }
      })

      this.DIR_IMAGE_LIST_PERSIST()
    },

    DIR_IMAGE_LIST_REMOVE_DIR(directoryPath: string) {
      if (directoryPath === '/') {
        return
      }

      const directories = directoryPath.split('/')
      let currentDirectory = this.dirImageListModule.dirObject

      directories.forEach((directory, index) => {
        const targetIndex = currentDirectory.childrenDirs.findIndex(
          item => item.dir === directory,
        )

        if (targetIndex === -1) {
          return
        }

        const targetDirectory = currentDirectory.childrenDirs[targetIndex]
        if (index === directories.length - 1) {
          currentDirectory.childrenDirs.splice(targetIndex, 1)
        }
        currentDirectory = targetDirectory
      })

      this.DIR_IMAGE_LIST_PERSIST()
    },

    DIR_IMAGE_LIST_ADD_IMAGE(image: UploadedImageModel) {
      const rootDirectory = this.dirImageListModule.dirObject

      if (image.dir === '/') {
        if (!rootDirectory.imageList.some(item => item.name === image.name)) {
          rootDirectory.imageList.push(image)
        }
        this.DIR_IMAGE_LIST_PERSIST()
        return
      }

      let currentDirectory = rootDirectory
      let currentPath = ''

      image.dir.split('/').forEach((directory, index, directoryList) => {
        currentPath += `${index > 0 ? '/' : ''}${directory}`
        let targetDirectory = currentDirectory.childrenDirs.find(item => item.dir === directory)

        if (!targetDirectory) {
          targetDirectory = createDirObject(directory, currentPath)
          currentDirectory.childrenDirs.push(targetDirectory)
        }

        currentDirectory = targetDirectory
        if (
          index === directoryList.length - 1
          && !currentDirectory.imageList.some(item => item.name === image.name)
        ) {
          currentDirectory.imageList.push(image)
        }
      })

      this.DIR_IMAGE_LIST_PERSIST()
    },

    DIR_IMAGE_LIST_REMOVE(image: UploadedImageModel) {
      const removeImage = (imageList: UploadedImageModel[], uuid: string): void => {
        const removeIndex = imageList.findIndex(item => item.uuid === uuid)
        if (removeIndex !== -1) {
          imageList.splice(removeIndex, 1)
        }
      }
      const rootDirectory = this.dirImageListModule.dirObject

      if (image.dir === '/') {
        removeImage(rootDirectory.imageList, image.uuid)
        this.DIR_IMAGE_LIST_PERSIST()
        return
      }

      let currentDirectory: DirObject | null = rootDirectory
      image.dir.split('/').forEach((directory, index, directoryList) => {
        currentDirectory
          = currentDirectory?.childrenDirs.find(item => item.dir === directory) ?? null

        if (currentDirectory && index === directoryList.length - 1) {
          removeImage(currentDirectory.imageList, image.uuid)
        }
      })

      if (!currentDirectory) {
        return
      }

      if (!currentDirectory.imageList.length && !currentDirectory.childrenDirs.length) {
        getUpLevelDirList(currentDirectory.dirPath).forEach((directoryPath) => {
          const directoryContent = getDirContent(directoryPath, rootDirectory)

          if (
            directoryContent
            && !directoryContent.imageList.length
            && !directoryContent.childrenDirs.length
          ) {
            const { dirPath } = getUpOneLevelDir(directoryPath)
            const selectedDirList = dirPath === '/' ? [] : dirPath.split('/')

            if (dirPath === '/') {
              this.USER_CONFIG_INFO_REMOVE_DIR(directoryPath)
            }

            this.SET_USER_CONFIG_INFO({
              viewDir: dirPath,
              selectedDir: dirPath,
              selectedDirList,
            })
            this.DIR_IMAGE_LIST_REMOVE_DIR(directoryPath)
          }
        })
      }
    },

    DIR_IMAGE_LIST_INIT_DIR(directoryPath: string) {
      const directory = getDirContent(directoryPath, this.dirImageListModule.dirObject)

      if (!directory) {
        return
      }

      directory.imageList = []
      directory.childrenDirs = []
      this.DIR_IMAGE_LIST_PERSIST()
    },

    DIR_IMAGE_LIST_REPLACE_CONTENT({ path, directories, images }: { path: string, directories: DirObject[], images: UploadedImageModel[] }) {
      if (path !== '/' && !getDirContent(path, this.getDirObject))
        this.DIR_IMAGE_LIST_ADD_DIR(path)
      const directory = getDirContent(path, this.getDirObject)
      if (!directory)
        return
      directory.childrenDirs = directories
      directory.imageList = images
      if (path === '/') {
        this.userConfigInfoModule.userConfigInfo.dirList = directories.map(item => ({ value: item.dir, label: item.dir }))
        this.USER_CONFIG_INFO_PERSIST()
      }
      this.DIR_IMAGE_LIST_PERSIST()
    },

    DIR_IMAGE_LIST_REMOVE_CONFIRMED_MEDIA({ path, sha }: { path: string, sha: string }) {
      const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '/'
      const directory = getDirContent(parent, this.getDirObject)
      if (directory)
        directory.imageList = directory.imageList.filter(image => image.path !== path || image.sha !== sha)
      this.DIR_IMAGE_LIST_PERSIST()
    },

    DIR_IMAGE_LIST_RELOCATE_MEDIA({ original, image }: { original: UploadedImageModel, image: UploadedImageModel }) {
      this.DIR_IMAGE_LIST_REMOVE_CONFIRMED_MEDIA(original)
      if (image.dir !== '/')
        this.DIR_IMAGE_LIST_ADD_DIR(image.dir)
      const directory = getDirContent(image.dir, this.getDirObject)
      if (!directory)
        return
      directory.imageList = [...directory.imageList.filter(item => item.path !== image.path), image]
      this.DIR_IMAGE_LIST_PERSIST()
    },

    // 图床管理 - 重命名目录（同步更新子孙目录 dirPath、图片 dir/path 及用户配置里的目录引用）
    DIR_IMAGE_LIST_RENAME_DIR({
      oldDirPath,
      newDirName,
    }: { oldDirPath: string, newDirName: string }) {
      if (oldDirPath === '/' || !newDirName) {
        return
      }

      const rootDirectory = this.dirImageListModule.dirObject
      const targetDirectory = getDirContent(oldDirPath, rootDirectory)

      if (!targetDirectory) {
        return
      }

      const parentPath = getUpOneLevelDir(oldDirPath).dirPath
      const newDirPath = parentPath === '/' ? newDirName : `${parentPath}/${newDirName}`

      const updateDirectoryPaths = (directory: DirObject, directoryPath: string): void => {
        directory.dirPath = directoryPath
        directory.imageList.forEach((image) => {
          image.dir = directoryPath
          image.path = `${directoryPath}/${image.name}`
        })
        directory.childrenDirs.forEach(childDirectory =>
          updateDirectoryPaths(childDirectory, `${directoryPath}/${childDirectory.dir}`),
        )
      }

      targetDirectory.dir = newDirName
      updateDirectoryPaths(targetDirectory, newDirPath)

      // dirList 只记录顶级目录
      if (!oldDirPath.includes('/')) {
        this.USER_CONFIG_INFO_REMOVE_DIR(oldDirPath)
        this.USER_CONFIG_INFO_ADD_DIR(newDirName)
      }

      const replacePathPrefix = (path: string): string => {
        if (path === oldDirPath) {
          return newDirPath
        }
        if (path.startsWith(`${oldDirPath}/`)) {
          return `${newDirPath}${path.slice(oldDirPath.length)}`
        }
        return path
      }

      const { viewDir, selectedDir } = this.userConfigInfoModule.userConfigInfo
      const newViewDir = replacePathPrefix(viewDir)
      const newSelectedDir = replacePathPrefix(selectedDir)

      if (newViewDir !== viewDir || newSelectedDir !== selectedDir) {
        this.SET_USER_CONFIG_INFO({
          viewDir: newViewDir,
          selectedDir: newSelectedDir,
          selectedDirList:
            newSelectedDir === '/' || newSelectedDir === '' ? [] : newSelectedDir.split('/'),
        })
      }

      this.DIR_IMAGE_LIST_PERSIST()
    },

    // 图床管理 - 删除目录（含用户配置里的目录引用清理与视图目录回退）
    DIR_IMAGE_LIST_REMOVE_DIR_TREE(directoryPath: string) {
      if (directoryPath === '/') {
        return
      }

      this.DIR_IMAGE_LIST_REMOVE_DIR(directoryPath)

      if (!directoryPath.includes('/')) {
        this.USER_CONFIG_INFO_REMOVE_DIR(directoryPath)
      }

      const isInsideDir = (path: string): boolean =>
        path === directoryPath || path.startsWith(`${directoryPath}/`)

      const { viewDir, selectedDir } = this.userConfigInfoModule.userConfigInfo

      if (isInsideDir(viewDir) || isInsideDir(selectedDir)) {
        const parentPath = getUpOneLevelDir(directoryPath).dirPath
        const newViewDir = isInsideDir(viewDir) ? parentPath : viewDir
        const newSelectedDir = isInsideDir(selectedDir) ? parentPath : selectedDir

        this.SET_USER_CONFIG_INFO({
          viewDir: newViewDir,
          selectedDir: newSelectedDir,
          selectedDirList:
            newSelectedDir === '/' || newSelectedDir === '' ? [] : newSelectedDir.split('/'),
        })
      }
    },

    // 图床管理 - 移动图片到其他目录
    DIR_IMAGE_LIST_MOVE_IMAGE({ img, newDir }: { img: UploadedImageModel, newDir: string }) {
      if (!img || img.dir === newDir) {
        return
      }

      const rootDirectory = this.dirImageListModule.dirObject
      const oldDirectory = img.dir === '/' ? rootDirectory : getDirContent(img.dir, rootDirectory)

      // 从原目录的图片列表中移除
      if (oldDirectory) {
        const removeIndex = oldDirectory.imageList.findIndex(item => item.uuid === img.uuid)
        if (removeIndex !== -1) {
          oldDirectory.imageList.splice(removeIndex, 1)
        }
      }

      // 原目录被移空后删除该目录；若当前正浏览该目录则返回上一级
      if (
        oldDirectory
        && img.dir !== '/'
        && !oldDirectory.imageList.length
        && !oldDirectory.childrenDirs.length
      ) {
        this.DIR_IMAGE_LIST_REMOVE_DIR(img.dir)

        if (!img.dir.includes('/')) {
          this.USER_CONFIG_INFO_REMOVE_DIR(img.dir)
        }

        const { viewDir } = this.userConfigInfoModule.userConfigInfo
        if (viewDir === img.dir) {
          const parentPath = getUpOneLevelDir(img.dir).dirPath
          this.SET_USER_CONFIG_INFO({
            viewDir: parentPath,
            selectedDir: parentPath,
            selectedDirList: parentPath === '/' ? [] : parentPath.split('/'),
          })
        }
      }

      // 加入目标目录
      img.dir = newDir
      img.path = newDir === '/' ? img.name : `${newDir}/${img.name}`
      this.DIR_IMAGE_LIST_ADD_DIR(newDir)
      this.DIR_IMAGE_LIST_ADD_IMAGE(img)
    },

    DIR_IMAGE_LIST_PERSIST() {
      setLocal(LS_MANAGEMENT, this.dirImageListModule.dirObject)
    },

    DIR_IMAGE_LOGOUT() {
      this.dirImageListModule.dirObject = createDirObject('/', '/')
      this.DIR_IMAGE_LIST_PERSIST()
    },

    IMAGE_CARD({ imageObj }: { imageObj: UploadedImageModel }) {
      if (!imageObj.checked) {
        return
      }

      this.imageCardModule.imgCardArr.forEach((image) => {
        if (image.uuid === imageObj.uuid) {
          image.checked = true
        }
      })
    },

    REPLACE_IMAGE_CARD({ checkedImgArr }: { checkedImgArr: UploadedImageModel[] }) {
      this.imageCardModule.imgCardArr = checkedImgArr.length > 0 ? checkedImgArr : []
    },

    SET_UPLOAD_AREA_STATE(info: Partial<UploadAreaStateTypes>) {
      assignKnownProperties(this.uploadAreaModule, info)
    },

    UPLOAD_AREA_ACTIVE_LOGOUT() {
      this.uploadAreaModule.isActive = false
      this.uploadAreaModule.isPaste = false
      this.uploadAreaModule.pressShiftKey = false
      this.uploadAreaModule.activeInfo = null
    },

    TOOLBOX_IMG_LIST_ADD(image: ImgProcessStateModel) {
      this.toolboxImageListModule.toolboxImageList.unshift(image)
    },

    TOOLBOX_IMG_LIST_REMOVE(uuid: string) {
      const imageList = this.toolboxImageListModule.toolboxImageList
      const removeIndex = imageList.findIndex(image => image.uuid === uuid)

      if (removeIndex !== -1) {
        imageList.splice(removeIndex, 1)
      }
    },

    TOOLBOX_IMG_LIST_RESET() {
      this.toolboxImageListModule.toolboxImageList = []
    },

    UPLOAD_IMG_LIST_ADD(image: UploadImageModel) {
      this.uploadImageListModule.uploadImageList.unshift(image)
    },

    UPLOAD_IMG_LIST_REMOVE(uuid: string) {
      const imageList = this.uploadImageListModule.uploadImageList
      const removeIndex = imageList.findIndex(image => image.uuid === uuid)

      if (removeIndex !== -1 && imageList[removeIndex].uploadStatus.progress === 0) {
        imageList.splice(removeIndex, 1)
      }
    },

    UPLOAD_IMG_LIST_RESET() {
      this.uploadImageListModule.uploadImageList = []
      this.uploadRuntime = {}
      this.uploadBatches = []
    },

    SET_DEPLOY_STATUS_INFO(statusInfo: DeployStatusInfo) {
      deepAssignObject(this.deployStatusModule, statusInfo)
    },

    LOGOUT() {
      this.connectionAttemptId += 1
      this.connection = { phase: 'disconnected' }
      this.uploadTargetBusy = false
      cleanObject(this.githubAuthorizeModule.authorizationInfo)
      this.UPLOAD_AREA_ACTIVE_LOGOUT()
      this.DIR_IMAGE_LOGOUT()
      this.USER_CONFIG_INFO_LOGOUT()
      this.USER_SETTINGS_LOGOUT()
      this.TOOLBOX_IMG_LIST_RESET()
      this.UPLOAD_IMG_LIST_RESET()
      localStorage.clear()
      sessionStorage.clear()
    },
  },
})
