import { watch } from 'vue'
import { getCloudSettings, parseCloudSettings, saveCloudSettings } from '@/common/api/settings'
import { store } from '@/stores'

const PUSH_DEBOUNCE_MS = 1000

/**
 * 图床设置后台静默云同步（.settings 文件）。
 *
 * - 登录就绪（已登录且图床仓库信息可用）后拉取云端 `.settings`：
 *   存在则应用到本地用户设置并持久化到 LocalStorage 的 PICX_SETTINGS；
 *   不存在则把本地设置播种到云端，建立同步基准。
 * - 本地设置发生变更后，防抖推送到云端，保持两端一致。
 * - 全程静默，失败仅记录日志；由于成功前快照不更新，下次变更或重新登录时会自动重试。
 *
 * 在应用壳层（app-wrap）调用一次即可，随登出/登入自动重置。
 */
export const useCloudSettingsSync = () => {
  let pulling = false
  let pushing = false
  let pendingPush = false
  let pushTimer: ReturnType<typeof setTimeout> | undefined
  // 最近一次与云端一致的数据快照，用于抑制拉取回声和去除无变化的推送
  let syncedSnapshot: string | null = null

  const isSyncReady = () => {
    const { logined, repo, branch } = store.getters.getUserConfigInfo
    return Boolean(logined && repo && branch)
  }

  const serializeUserSettings = () => JSON.stringify(store.getters.getUserSettings)

  const pushNow = async () => {
    if (!isSyncReady() || pulling) {
      return
    }
    if (pushing) {
      pendingPush = true
      return
    }

    const payloadSnapshot = serializeUserSettings()
    if (payloadSnapshot === syncedSnapshot) {
      return
    }

    pushing = true
    try {
      const success = await saveCloudSettings(
        store.getters.getUserSettings,
        store.getters.getUserConfigInfo,
      )

      if (success) {
        syncedSnapshot = payloadSnapshot
      }
      else {
        console.error('PicX Error // push cloud settings failed')
      }
    }
    catch (err) {
      console.error('PicX Error // push cloud settings failed >> ', err)
    }
    finally {
      pushing = false
    }

    // 推送期间有新修改、或推送期间又有排队请求时，重新推送（pushNow 内部会再次校验差异与状态）
    const changedDuringPush
      = syncedSnapshot === payloadSnapshot && serializeUserSettings() !== payloadSnapshot
    if (pendingPush || changedDuringPush) {
      pendingPush = false
      await pushNow()
    }
  }

  const schedulePush = () => {
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      pushTimer = undefined
      pushNow()
    }, PUSH_DEBOUNCE_MS)
  }

  const pullCloudSettings = async () => {
    if (pulling) {
      return
    }

    pulling = true
    try {
      const cloudFile = await getCloudSettings(store.getters.getUserConfigInfo)
      const cloudSettings = cloudFile ? parseCloudSettings(cloudFile) : null

      if (cloudSettings) {
        // 云端存在 .settings：应用到本地设置（SET_USER_SETTINGS 内部会持久化到 LocalStorage）
        await store.dispatch('SET_USER_SETTINGS', cloudSettings)
        syncedSnapshot = serializeUserSettings()
      }
      else {
        // 云端不存在（或内容损坏）：交由播种逻辑把本地设置推送到云端
        syncedSnapshot = null
      }
    }
    catch (err) {
      console.error('PicX Error // pull cloud settings failed >> ', err)
      syncedSnapshot = null
    }
    finally {
      pulling = false
    }

    if (syncedSnapshot === null) {
      await pushNow()
    }
  }

  const flushPendingPush = () => {
    if (pushTimer) {
      clearTimeout(pushTimer)
      pushTimer = undefined
    }
    pushNow()
  }

  const start = () => {
    // 登录就绪后拉取云端设置，覆盖「刷新页面时已登录」和「OAuth/Token 新登录」两种场景
    watch(
      isSyncReady,
      (ready) => {
        if (ready) {
          pullCloudSettings()
        }
        else {
          // 退出登录：清理同步状态，等待下次登录重新拉取
          syncedSnapshot = null
          clearTimeout(pushTimer)
          pushTimer = undefined
        }
      },
      { immediate: true },
    )

    // 本地设置变化后防抖推送到云端（拉取应用产生的变更会被快照比对滤除）
    watch(
      () => store.getters.getUserSettings,
      () => {
        if (isSyncReady()) {
          schedulePush()
        }
      },
      { deep: true },
    )

    // 页面隐藏或关闭时立即冲刷未推送的本地修改，避免云端落后
    window.addEventListener('pagehide', flushPendingPush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPendingPush()
      }
    })
  }

  start()
}
