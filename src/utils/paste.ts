import selectedFileHandle from './selected-file-handle'

const onPaste = (e: any, maxsize: number): Promise<any> | null => {
  if (!(e.clipboardData && e.clipboardData.items)) {
    return null
  }

  // eslint-disable-next-line consistent-return
  return new Promise((resolve) => {
    // eslint-disable-next-line no-plusplus
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      const item = e.clipboardData.items[i]
      if (item.kind === 'file') {
        const pasteFile = item.getAsFile()

        selectedFileHandle(pasteFile, maxsize)?.then((result) => {
          if (!result) {
            return
          }
          const { base64, originalFile, compressFile } = result
          resolve({ base64, originalFile, compressFile })
        })
      }
    }
  })
}

export default onPaste
