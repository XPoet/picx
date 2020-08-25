export const filenameHandle = (filename) => {
  const splitIndex = filename.lastIndexOf('.')
  const name = filename.substr(0, splitIndex)
  const suffix = filename.substr(splitIndex + 1, filename.length)
  const hash = Math.random().toString(36).substr(2);
  return {
    name: name,
    hash: hash,
    suffix: suffix,
  }
}

export const isImage = (suffix) => {
  return /(png|jpg|gif|jpeg|webp)$/.test(suffix)
}
