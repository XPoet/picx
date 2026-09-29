import type {
  ImageLinkRuleModel,
  ImgProcessStateModel,
  UploadedImageModel,
  UploadImageModel,
  UserConfigInfoModel,
  UserSettingsModel,
} from '@/common/model'
import type DeployStatusInfo from '@/stores/modules/deploy-status/types'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import type { GitHubAuthorizationInfo } from '@/stores/modules/github-authorize/types'
import type UploadAreaStateTypes from '@/stores/modules/upload-area/types'
import type { GlobalSettingsModel } from '@/stores/modules/user-settings/types'
import { defineStore } from 'pinia'
import {
  LS_AUTHORIZATION,
  LS_CONFIG,
  LS_MANAGEMENT,
  LS_SETTINGS,
  NEW_DIR_COUNT_MAX,
  SS_GLOBAL_SETTINGS,
} from '@/common/constant'
import {
  CompressEncoderEnum,
  DirModeEnum,
  ElementPlusSizeEnum,
  ImageLinkTypeEnum,
  LanguageEnum,
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

interface PicxState {
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
      addPrefix: { enable: false, prefix: '' },
    },
    compress: {
      enable: true,
      encoder: CompressEncoderEnum.webP,
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
  const userSettings = createDefaultUserSettings()
  const storedSettings = getLocal(LS_SETTINGS) as Partial<UserSettingsModel> | null

  if (storedSettings) {
    deepAssignObject(userSettings, storedSettings)
  }

  return userSettings
}

/**
 * 创建全局界面设置。
 */
function createGlobalSettings(): GlobalSettingsModel {
  const globalSettings: GlobalSettingsModel = {
    showAnnouncement: true,
    folded: false,
    elementPlusSize: ElementPlusSizeEnum.default,
    language: LanguageEnum.zhCN,
    languageToggleTip: true,
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
 * 规范化新建目录和分支名称。
 */
function normalizeUserConfigInfo(userConfigInfo: UserConfigInfoModel): void {
  const { selectedDir, branch, dirMode } = userConfigInfo

  if (dirMode === DirModeEnum.newDir) {
    const specialCharacters = [' ', '.', '、', ',', '，', '!', '？', '?']
    let slashCount = 0
    let normalizedDirectory = ''

    for (const character of selectedDir) {
      const normalizedCharacter = specialCharacters.includes(character) ? '-' : character

      if (normalizedCharacter === '/') {
        slashCount += 1
      }
      if (slashCount >= NEW_DIR_COUNT_MAX) {
        break
      }
      normalizedDirectory += normalizedCharacter
    }

    userConfigInfo.selectedDir = normalizedDirectory
  }

  userConfigInfo.branch = branch.replace(/\s+/g, '-')
}

/**
 * PicX 的 Pinia 兼容 Store。
 *
 * 第一阶段保留旧 Vuex 的模块状态形状和 action 名称，页面无需同步重写。
 */
export const usePicxStore = defineStore('picx', {
  state: (): PicxState => ({
    rootName: 'root',
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
      normalizeUserConfigInfo(this.userConfigInfoModule.userConfigInfo)
      localStorage.setItem(LS_CONFIG, JSON.stringify(this.userConfigInfoModule.userConfigInfo))
    },

    USER_CONFIG_INFO_LOGOUT() {
      cleanObject(this.userConfigInfoModule.userConfigInfo)
    },

    SET_USER_SETTINGS(settingsInfo: Partial<UserSettingsModel>) {
      assignKnownProperties(this.userSettingsModule.userSettings, settingsInfo)
      this.USER_SETTINGS_PERSIST()
    },

    SET_GLOBAL_SETTINGS(globalSettings: Partial<GlobalSettingsModel>) {
      assignKnownProperties(this.userSettingsModule.globalSettings, globalSettings)
      setSession(SS_GLOBAL_SETTINGS, this.userSettingsModule.globalSettings)
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
      setLocal(LS_SETTINGS, this.userSettingsModule.userSettings)
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
    },

    SET_DEPLOY_STATUS_INFO(statusInfo: DeployStatusInfo) {
      deepAssignObject(this.deployStatusModule, statusInfo)
    },

    LOGOUT() {
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
