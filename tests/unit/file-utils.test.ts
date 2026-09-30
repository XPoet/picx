import { describe, expect, it } from 'vitest'
import {
  getFilename,
  getFileSize,
  getFileSuffix,
  isImage,
  isNeedCompress,
  isNeedWatermark,
} from '@/utils/file-utils'

describe('文件工具', () => {
  it('能够拆分文件名和后缀', () => {
    expect(getFilename('photo.final.webp')).toBe('photo.final')
    expect(getFileSuffix('photo.final.webp')).toBe('webp')
  })

  it('能够识别支持的图片处理类型', () => {
    expect(isImage('image/png')).toBe(true)
    expect(isImage('text/plain')).toBe(false)
    expect(isNeedCompress('image/jpeg')).toBe(true)
    expect(isNeedCompress('image/gif')).toBe(false)
    expect(isNeedWatermark('image/webp')).toBe(true)
    expect(isNeedWatermark('image/gif')).toBe(false)
  })

  it('能够格式化文件大小', () => {
    expect(getFileSize(1024)).toBe(1)
    expect(getFileSize(1024 * 1024)).toBe(1024)
  })
})
