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

export async function addWatermarkToImage(
  imageFile: File,
  watermarkText: string,
  watermarkFontSize: number,
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  watermarkOpacity: number
): Promise<File> {
  const img = await loadImageFromFile(imageFile)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)
  ctx.font = `${watermarkFontSize}px Arial`
  ctx.fillStyle = `rgba(0, 0, 0, ${watermarkOpacity})`

  switch (watermarkPosition) {
    case 'top-left':
      ctx.fillText(watermarkText, 10, 30)
      break
    case 'top-right':
      ctx.fillText(watermarkText, canvas.width - ctx.measureText(watermarkText).width - 10, 30)
      break
    case 'bottom-left':
      ctx.fillText(watermarkText, 10, canvas.height - 10)
      break
    case 'bottom-right':
      ctx.fillText(
        watermarkText,
        canvas.width - ctx.measureText(watermarkText).width - 10,
        canvas.height - 10
      )
      break
    default:
      throw new Error('Invalid watermark watermarkPosition')
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob'))
        return
      }
      const newFile = new File([blob], imageFile.name, { type: imageFile.type })
      resolve(newFile)
    }, imageFile.type)
  })
}
