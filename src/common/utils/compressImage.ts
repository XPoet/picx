export const getImageFileType = (base64: string): string => {
  return base64.split(';')[0].replace(/data:(.*)/, '$1') // eg: image/png
}

export const compress = (
  base64Url: string,
  ratio: number,
  quality: number = 0.5
): Promise<string> => {
  let img: HTMLImageElement = new Image()
  img.src = base64Url
  const { width, height } = img

  return new Promise((resolve) => {
    img.onload = async () => {
      let canvas: HTMLCanvasElement = document.createElement('canvas')
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      const fileType = getImageFileType(base64Url)
      const compressedBase64URL = canvas.toDataURL(fileType, quality)
      canvas = null
      img = null
      resolve(compressedBase64URL)
    }
  })
}
