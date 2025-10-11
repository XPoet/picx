/* eslint-disable no-unused-vars */

import { ref } from 'vue'
import { gettingVideoFilesHandle } from '@/utils/file-utils'
import { VideoHandleResult } from '@/common/model'

export const useGettingVideo = (onSelectSuccess: (result: VideoHandleResult[]) => void) => {
  const curShowVideo = ref<{
    uuid: string
    objectURL: string
  }>({
    uuid: '',
    objectURL: ''
  })

  const handleVideoFiles = async (
    files: FileList | undefined | null
  ): Promise<VideoHandleResult[]> => {
    console.log('files', files)
    if (!files || files.length === 0) return []

    const uploadResult: VideoHandleResult[] = []

    await Promise.all(
      Array.from(files).map(async (file) => {
        const result = await gettingVideoFilesHandle(file)
        if (result) {
          uploadResult.push(result)
        }
      })
    )

    if (uploadResult.length > 0) {
      const lastIndex = uploadResult.length - 1
      const { uuid, objectURL } = uploadResult[lastIndex]
      curShowVideo.value = {
        uuid,
        objectURL
      }
    }

    return uploadResult
  }

  const onSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement

    onSelectSuccess(await handleVideoFiles(target.files))

    target.value = ''
    target.value = target.defaultValue
  }

  const onDrop = async (e: DragEvent) => {
    onSelectSuccess(await handleVideoFiles(e.dataTransfer?.files))
  }

  const onPaste = async (e: ClipboardEvent) => {
    onSelectSuccess(await handleVideoFiles(e.clipboardData?.files))
  }

  return {
    curShowVideo,
    onSelect,
    onDrop,
    onPaste
  }
}
