import type { UploadedImageModel } from '@/common/model'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLatestCommitTime } from '@/common/api'
import { useImageUploadTime } from '@/composables/use-image-upload-time'

vi.mock('@/common/api', async (original) => {
  const actual = await original<typeof import('@/common/api')>()
  return { ...actual, getLatestCommitTime: vi.fn() }
})

afterEach(() => vi.restoreAllMocks())

describe('按需上传时间回填', () => {
  it('切换后丢弃在途结果，不继续第七个请求；已知时间不查询', async () => {
    const resolvers: Array<(time: number | null) => void> = []
    vi.mocked(getLatestCommitTime).mockImplementation(() => new Promise(resolve => resolvers.push(resolve)))
    const images = Array.from({ length: 8 }, (_, index): UploadedImageModel => ({ type: 'image', uuid: String(index), sha: String(index), name: `${index}.png`, dir: '/', path: `${index}.png`, checked: false, deleting: false, size: 1, ...(index === 0 ? { uploadTime: 10 } : {}) }))
    const { backfillUploadTime, cancelBackfill } = useImageUploadTime()
    backfillUploadTime(images)
    expect(getLatestCommitTime).toHaveBeenCalledTimes(6)
    cancelBackfill()
    resolvers.forEach(resolve => resolve(100))
    await vi.waitFor(() => expect(images.slice(1).every(item => item.uploadTime === undefined)).toBe(true))
    await Promise.resolve()
    expect(getLatestCommitTime).toHaveBeenCalledTimes(6)
    expect(images[0].uploadTime).toBe(10)
  })
})
