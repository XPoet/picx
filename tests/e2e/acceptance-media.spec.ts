import { Buffer } from 'node:buffer'
import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { expect, test } from './fixtures'

test('T044 真实 MP4 编码样本可在文件详情解码播放', async ({ page, picx }, info) => {
  await picx.open('/upload', { savedRepository: true, processingDisabled: true })
  const sample = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 180
    const context = canvas.getContext('2d')
    if (!context)
      throw new Error('Canvas unavailable')
    const mimeType = 'video/mp4;codecs=avc1.42E01E'
    if (!MediaRecorder.isTypeSupported(mimeType))
      throw new Error('Real MP4 recorder unavailable')
    let frame = 0
    const draw = () => {
      context.fillStyle = '#416AAF'
      context.fillRect(0, 0, 320, 180)
      context.fillStyle = '#FFFFFF'
      context.font = '20px sans-serif'
      context.fillText('PicX P6 acceptance', 24, 70)
      context.fillRect(24 + frame++ % 30, 110, 80, 16)
    }
    draw()
    const png = canvas.toDataURL('image/png').split(',')[1]
    const stream = canvas.captureStream(10)
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []
    recorder.addEventListener('dataavailable', event => chunks.push(event.data))
    const stopped = new Promise<void>(resolve => recorder.addEventListener('stop', () => resolve(), { once: true }))
    const timer = setInterval(draw, 100)
    recorder.start()
    await new Promise<void>(resolve => setTimeout(resolve, 1200))
    recorder.stop()
    await stopped
    clearInterval(timer)
    stream.getTracks().forEach(track => track.stop())
    const mp4 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject(new Error('Media read failed'))
      reader.onerror = () => reject(new Error('Media read failed'))
      reader.readAsDataURL(new Blob(chunks, { type: 'video/mp4' }))
    })
    return { png, mp4 }
  })
  const bytes = Buffer.from(sample.mp4, 'base64')
  expect(bytes.length).toBeGreaterThan(1000)
  if (info.project.name === 'desktop-chrome' && process.env.PICX_PREPARE_REMOTE_MEDIA === '1') {
    await mkdir('/private/tmp/picx-p6-media', { recursive: true })
    await writeFile('/private/tmp/picx-p6-media/p6-single.png', Buffer.from(sample.png, 'base64'))
    await writeFile('/private/tmp/picx-p6-media/p6-multi.png', Buffer.from(sample.png, 'base64'))
    await writeFile('/private/tmp/picx-p6-media/p6-clip.mp4', bytes)
  }
  await page.locator('.getting-images-container input[type=file]').setInputFiles({ name: 'p6-clip.mp4', mimeType: 'video/mp4', buffer: bytes })
  await expect(page.locator('.uploaded-item')).toHaveCount(1)
  await page.getByRole('button', { name: '查看 p6-clip.mp4 的详情', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '文件详情', exact: true })
  const video = dialog.locator('video')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => [element.videoWidth, element.videoHeight])).toEqual([320, 180])
  await video.evaluate((element: HTMLVideoElement) => element.play())
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.1)
  await video.evaluate((element: HTMLVideoElement) => element.pause())
  if (info.project.name === 'desktop-chrome' && process.env.PICX_PREPARE_REMOTE_MEDIA === '1')
    await page.screenshot({ path: 'docs/UI/evidence/p6/t044-chrome-mp4-preview.png', fullPage: true })
  await dialog.getByRole('button', { name: '关闭', exact: true }).click()
  await expect(dialog).toBeHidden()
})
