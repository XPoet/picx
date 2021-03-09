import chooseImg from './chooseImg.js'

const onPaste = (e, maxsize = 200 * 1024) => {
  if (!(e.clipboardData && e.clipboardData.items)) {
    return
  }

  return new Promise((resolve) => {
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      const item = e.clipboardData.items[i]
      if (item.kind === 'file') {
        const pasteFile = item.getAsFile()
        chooseImg(pasteFile, (url, file) => {
          resolve({ url, file })
        }, maxsize)
      }
    }
  })
}

export default onPaste
