export interface ImgInfo {
  name: string
  size: number
  lastModified: number
  url: string
}
export default interface ImageViewerStateTypes {
  imageViewer: {
    imgInfo: ImgInfo | null
    isShow: boolean
  }
}
