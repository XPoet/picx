import { createPinia } from 'pinia'
import { usePicxStore } from './picx-store'

export const pinia = createPinia()

const picxStore = usePicxStore(pinia)

/**
 * 调用迁移期保留的 Vuex 风格 action。
 */
function invokeAction(type: string, payload?: unknown): unknown {
  const action = Reflect.get(picxStore, type)

  if (typeof action !== 'function') {
    throw new TypeError(`未知的 Store action：${type}`)
  }

  return Reflect.apply(action, picxStore, payload === undefined ? [] : [payload])
}

/**
 * Pinia 迁移兼容门面。
 *
 * 业务组件迁移为直接调用 Pinia action 后，可移除此门面。
 */
export const store = {
  getters: {
    get getGitHubAuthorizationInfo() {
      return picxStore.getGitHubAuthorizationInfo
    },
    get getUserLoginStatus() {
      return picxStore.getUserLoginStatus
    },
    get getUserConfigInfo() {
      return picxStore.getUserConfigInfo
    },
    get getUserViewDir() {
      return picxStore.getUserViewDir
    },
    get getUserSettings() {
      return picxStore.getUserSettings
    },
    get getGlobalSettings() {
      return picxStore.getGlobalSettings
    },
    get getDirObject() {
      return picxStore.getDirObject
    },
    get getImageCardArr() {
      return picxStore.getImageCardArr
    },
    get getImageCardCheckedArr() {
      return picxStore.getImageCardCheckedArr
    },
    get getUploadAreaState() {
      return picxStore.getUploadAreaState
    },
    get getToolboxImageList() {
      return picxStore.getToolboxImageList
    },
    get getUploadImageList() {
      return picxStore.getUploadImageList
    },
    get getDeployStatusInfo() {
      return picxStore.getDeployStatusInfo
    },
  },
  state: {
    get dirImageListModule() {
      return picxStore.dirImageListModule
    },
    get userConfigInfoModule() {
      return picxStore.userConfigInfoModule
    },
    get imageCardModule() {
      return picxStore.imageCardModule
    },
    get uploadAreaModule() {
      return picxStore.uploadAreaModule
    },
    get userSettingsModule() {
      return picxStore.userSettingsModule
    },
    get toolboxImageListModule() {
      return picxStore.toolboxImageListModule
    },
    get uploadImageListModule() {
      return picxStore.uploadImageListModule
    },
    get githubAuthorizeModule() {
      return picxStore.githubAuthorizeModule
    },
    get deployStatusModule() {
      return picxStore.deployStatusModule
    },
  },
  dispatch(type: string, payload?: unknown): Promise<unknown> {
    return Promise.resolve(invokeAction(type, payload))
  },
  commit(type: string, payload?: unknown): void {
    invokeAction(type, payload)
  },
}

/**
 * 返回全局 Pinia 兼容门面。
 */
export function useStore() {
  return store
}
