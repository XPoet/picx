import type { UploadedImageModel } from '@/common/model'
import { getLatestCommitTime } from '@/common/api'
import { store } from '@/stores'

/** 并发请求数上限，避免大目录回填时触发 GitHub API 限流 */
const CONCURRENCY = 6

/** 回填结果的持久化防抖时长（ms） */
const PERSIST_DEBOUNCE_MS = 1500

/**
 * 图床管理页“最新上传优先”排序的上传时间后台回填。
 *
 * - GitHub Contents API 不返回文件时间戳，这里按文件路径调用 commits API
 *   取最近一次 commit 时间作为上传时间，写入图片对象并随目录树持久化。
 * - 已有 uploadTime、正在请求或本会话已失败的文件不会重复请求，
 *   即每个文件终身只回填一次（清空浏览器存储后重新回填）。
 * - 单飞循环：重复调用只会更新目标列表（如目录切换、上传新增），
 *   不会打断进行中的批次；回填过程中列表被替换、时间写入引发的重新渲染
 *   都不会导致任务重启。
 * - cancelBackfill 用于目录切换、排序模式切换、组件卸载时停止后续批次；
 *   已在途的单个请求结果仍会写入并持久化。
 *
 * 在图床管理页调用，排序模式切到 timeDesc 时触发 backfillUploadTime。
 */
export const useImageUploadTime = () => {
  const inflightPaths = new Set<string>()
  const failedPaths = new Set<string>()
  let persistTimer: ReturnType<typeof setTimeout> | undefined
  let latestImages: UploadedImageModel[] = []
  let running = false
  let cancelled = false

  const persistDebounced = () => {
    clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      store.dispatch('DIR_IMAGE_LIST_PERSIST')
    }, PERSIST_DEBOUNCE_MS)
  }

  const pendingImages = () =>
    latestImages.filter(
      img =>
        img.uploadTime === undefined
        && !inflightPaths.has(img.path)
        && !failedPaths.has(img.path),
    )

  const processLoop = async () => {
    try {
      for (;;) {
        if (cancelled || !latestImages.length) {
          return
        }

        const pending = pendingImages()
        if (!pending.length) {
          return
        }

        for (let i = 0; i < pending.length; i += CONCURRENCY) {
          if (cancelled) {
            return
          }

          await Promise.all(
            pending.slice(i, i + CONCURRENCY).map(async (img) => {
              inflightPaths.add(img.path)
              try {
                const time = await getLatestCommitTime(store.getters.getUserConfigInfo, img.path)

                if (time === null) {
                  failedPaths.add(img.path)
                  return
                }

                img.uploadTime = time
                persistDebounced()
              }
              finally {
                inflightPaths.delete(img.path)
              }
            }),
          )
        }
      }
    }
    finally {
      running = false
    }
  }

  /**
   * 为缺少上传时间的图片后台回填上传时间（静默失败，不打扰用户）
   * @param images 目标图片列表，重复调用会以最新一次传入的列表为准。
   */
  const backfillUploadTime = (images: UploadedImageModel[]) => {
    latestImages = images
    cancelled = false

    if (running) {
      return
    }
    running = true
    void processLoop()
  }

  /** 停止后续回填批次（目录切换、排序模式切换、组件卸载时调用） */
  const cancelBackfill = () => {
    cancelled = true
    latestImages = []
  }

  return { backfillUploadTime, cancelBackfill }
}
