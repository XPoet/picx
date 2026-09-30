import type { UserSettingsModel } from '@/common/model'
import { WatermarkPositionEnum } from '@/common/model'

function loadImageFromFile(imageFile: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.setAttribute('crossOrigin', 'Anonymous')
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(imageFile)
  })
}

function hexToRgb(hex: string): string {
  if (hex) {
    hex = hex.replace('#', '')
  }
  else {
    return `255,255,255`
  }
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export async function addWatermarkToImage(
  imageFile: File,
  watermarkConfig: UserSettingsModel['watermark'],
): Promise<File | null> {
  const { text, fontSize, position, textColor, opacity, rotate, gap } = watermarkConfig
  const [r, g, b] = hexToRgb(textColor).split(',')
  const img = await loadImageFromFile(imageFile)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)
  ctx.font = `bold ${fontSize}px Arial`
  ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`
  ctx.lineWidth = 3
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`

  let x = 0
  let y = 0

  switch (position) {
    case WatermarkPositionEnum.leftTop:
      x = 10
      y = fontSize + 5
      break
    case WatermarkPositionEnum.rightTop:
      x = canvas.width - ctx.measureText(text).width - 10
      y = fontSize + 5
      break
    case WatermarkPositionEnum.leftBottom:
      x = 10
      y = canvas.height - 15
      break
    case WatermarkPositionEnum.rightBottom:
      x = canvas.width - ctx.measureText(text).width - 10
      y = canvas.height - 15
      break
  }

  if (position === WatermarkPositionEnum.fullScreen) {
    const textWidth = ctx.measureText(text).width
    const gapX = textWidth + gap
    const gapY = fontSize + gap
    const range = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotate * Math.PI) / 180)
    for (let row = -range; row < range; row += gapY) {
      for (let col = -range; col < range; col += gapX) {
        ctx.strokeText(text, col, row)
        ctx.fillText(text, col, row)
      }
    }
    ctx.restore()
  }
  else {
    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null)
      }
      else {
        const newFile = new File([blob], imageFile.name, { type: imageFile.type })
        resolve(newFile)
      }
    }, imageFile.type)
  })
}
