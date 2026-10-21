import { afterEach, describe, expect, it, vi } from 'vitest'
import { IMG_UPLOAD_MAX_SIZE, VIDEO_UPLOAD_MAX_SIZE } from '@/common/constant'
import { formatFileBytes, gettingFilesHandle, validateUploadFile } from '@/utils/file-utils'
import { imgFileToBase64 } from '@/utils/image-utils'
import { applyUploadNaming, createNamedUploadImage, finalUploadFile } from '@/utils/upload-naming'
import { createSettingsFixture } from '../fixtures/ui-redesign'

vi.mock('@/utils/image-utils', async importOriginal => ({ ...await importOriginal<typeof import('@/utils/image-utils')>(), imgFileToBase64: vi.fn(async () => 'data:image/png;base64,eA==') }))
function image(name = ' My photo.PNG', type = 'image/png') {
  const settings = createSettingsFixture().imageName
  return createNamedUploadImage({ uuid: crypto.randomUUID(), base64: 'data:image/png;base64,eA==', file: new File(['original'], name, { type }) }, settings)
}
afterEach(() => vi.useRealTimers())
describe('命名规则共用实际产物', () => {
  it('保留旧原名规则、空白处理及无扩展名图片', () => {
    const value = image()
    expect(value.filename.final).toBe('My-photo.png')
    expect(image('picture').filename.final).toBe('picture.png')
    expect(value.namingOverrides).toBeUndefined()
  })
  it('原名、哈希与前缀组合使用稳定的 6 字符短哈希', () => {
    const value = image('a.b.png')
    const settings = createSettingsFixture().imageName
    Object.assign(settings, { enableHash: true, addPrefix: { enable: true, prefix: 'pic-' } })
    applyUploadNaming(value, settings)
    expect(value.filename.hash).toMatch(/^[a-f0-9]{6}$/)
    expect(value.filename.hash).toBe(value.uuid.replace(/-/g, '').slice(0, 6))
    expect(value.uuid).toMatch(/^[a-f0-9-]{36}$/)
    expect(value.filename.final).toBe(`pic-a.b.${value.filename.hash}.png`)
    const name = value.filename.final
    applyUploadNaming(value, settings)
    expect(value.filename.final).toBe(name)
  })
  it('文件级覆写跟随未覆写偏好，时间戳与其他选项互斥且同毫秒唯一', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
    const settings = createSettingsFixture().imageName
    settings.enableHash = true
    settings.addPrefix = { enable: true, prefix: 'a-' }
    const value = image()
    value.namingOverrides = { isAddHash: false, isRename: true, newName: ' Custom Name ' }
    applyUploadNaming(value, settings)
    expect(value.filename.final).toBe('Custom-Name.png')
    settings.enableTimestamp = true
    const values = [value, image(), image()]
    values.forEach(item => applyUploadNaming(item, settings))
    expect(new Set(values.map(item => item.filename.final)).size).toBe(3)
    expect(value.filename.final).toMatch(/^\d+\.png$/)
    const timestamp = value.filename.final
    vi.advanceTimersByTime(10)
    applyUploadNaming(value, settings)
    expect(value.filename.final).toBe(timestamp)
    settings.enableTimestamp = false
    applyUploadNaming(value, settings)
    expect(value.filename.final).toBe('Custom-Name.png')
  })
  it('扩展名取采用产物，成功项保持原名，未知大小不显示 0KB', () => {
    const value = image()
    value.fileInfo.compressFile = new File(['x'], 'encoded.jpg', { type: 'image/webp' })
    applyUploadNaming(value, createSettingsFixture().imageName)
    expect(value.filename.final).toBe('My-photo.webp')
    expect(finalUploadFile(value)?.size).toBe(1)
    value.uploadStatus.progress = 100
    applyUploadNaming(value, { enableHash: true, enableTimestamp: true, addPrefix: { enable: true, prefix: 'changed' } })
    expect(value.filename.final).toBe('My-photo.webp')
    expect(formatFileBytes(undefined)).toBe('—')
    expect(formatFileBytes(0)).toBe('0 B')
    expect(formatFileBytes(1)).toBe('1 B')
    expect(formatFileBytes(1536)).toBe('1.5 KB')
  })
})
describe('真实 File.size 边界', () => {
  it.each([['image/png', IMG_UPLOAD_MAX_SIZE], ['video/mp4', VIDEO_UPLOAD_MAX_SIZE]] as const)('%s 恰好上限允许，超一字节拒绝', (type, max) => {
    const exact = new File([new Uint8Array(max * 1024 * 1024)], 'fixture', { type })
    expect(validateUploadFile(exact, true)).toEqual({ ok: true })
    const over = new File([exact, 'x'], 'fixture', { type })
    expect(validateUploadFile(over, true)).toMatchObject({ ok: false, reason: 'size' })
  })
  it('错误类型、工具中的视频与过大文件在读取前拒绝', async () => {
    expect(validateUploadFile(new File(['x'], 'a.txt', { type: 'text/plain' }), true)).toMatchObject({ ok: false, reason: 'type' })
    expect(validateUploadFile(new File(['x'], 'a.mp4', { type: 'video/mp4' }))).toMatchObject({ ok: false, reason: 'type' })
    const spy = vi.mocked(imgFileToBase64)
    spy.mockClear()
    await gettingFilesHandle(new File(['x'], 'a.txt', { type: 'text/plain' }))
    expect(spy).not.toHaveBeenCalled()
  })
})
