import type { UploadedImageModel } from '@/common/model'
import { getLatestCommitTime } from '@/common/api'
import { store } from '@/stores'

const CONCURRENCY = 6
const PERSIST_DEBOUNCE_MS = 1500

/** 仅为当前目录的最新上传排序回填时间；切换目标后丢弃旧批次并停止后续请求。 */
export function useImageUploadTime() {
  const failedPaths = new Set<string>()
  let generation = 0
  let persistTimer: ReturnType<typeof setTimeout> | undefined

  function persist() {
    clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      persistTimer = undefined
      void store.dispatch('DIR_IMAGE_LIST_PERSIST')
    }, PERSIST_DEBOUNCE_MS)
  }

  function cancelBackfill() {
    generation += 1
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = undefined
      void store.dispatch('DIR_IMAGE_LIST_PERSIST')
    }
  }

  function backfillUploadTime(images: UploadedImageModel[]) {
    cancelBackfill()
    const run = generation
    const config = { ...store.getters.getUserConfigInfo }
    const pending = images.filter(image => image.uploadTime === undefined && !failedPaths.has(image.path))
    void (async () => {
      for (let index = 0; index < pending.length; index += CONCURRENCY) {
        if (run !== generation)
          return
        await Promise.all(pending.slice(index, index + CONCURRENCY).map(async (image) => {
          const time = await getLatestCommitTime(config, image.path)
          if (run !== generation)
            return
          if (time === null) {
            failedPaths.add(image.path)
            return
          }
          image.uploadTime = time
          persist()
        }))
      }
    })()
  }

  return { backfillUploadTime, cancelBackfill }
}
