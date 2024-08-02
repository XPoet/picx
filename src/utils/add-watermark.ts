import { UserSettingsModel, WatermarkPositionEnum } from '@/common/model'

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
  } else {
    return `255,255,255`
  }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export async function addWatermarkToImage(
  imageFile: File,
  watermarkConfig: UserSettingsModel['watermark']
): Promise<File | null> {
  const { text, fontSize, position, textColor, opacity } = watermarkConfig
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

  const getPosition = (position: WatermarkPositionEnum) => {
    // eslint-disable-next-line default-case
    switch (position) {
      case WatermarkPositionEnum.leftTop:
        return {
          x: 10,
          y: fontSize + 5
        }
      case WatermarkPositionEnum.rightTop:
        return {
          x: canvas.width - ctx.measureText(text).width - 10,
          y: fontSize + 5
        }
      case WatermarkPositionEnum.leftBottom:
        return {
          x: 10,
          y: canvas.height - 15
        }
      case WatermarkPositionEnum.rightBottom:
        return {
          x: canvas.width - ctx.measureText(text).width - 10,
          y: canvas.height - 15
        }
      case WatermarkPositionEnum.random:
        // eslint-disable-next-line no-case-declarations
        const positions = [
          WatermarkPositionEnum.leftTop,
          WatermarkPositionEnum.leftBottom,
          WatermarkPositionEnum.rightTop,
          WatermarkPositionEnum.rightBottom
        ]
        // eslint-disable-next-line no-case-declarations
        const randomIndex = Math.floor(Math.random() * positions.length + 1)
        return getPosition(positions[randomIndex])
      default:
        return { x: 0, y: 0 }
    }
  }

  const { x, y } = getPosition(position)

  ctx.strokeText(text, x, y)
  ctx.fillText(text, x, y)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null)
      } else {
        const newFile = new File([blob], imageFile.name, { type: imageFile.type })
        resolve(newFile)
      }
    }, imageFile.type)
  })
}
