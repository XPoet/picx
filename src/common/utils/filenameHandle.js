const filenameHandle = (filename) => {

  const splitIndex = filename.lastIndexOf('.')
  const prefix = filename.substr(0, splitIndex)
  const suffix = filename.substr(splitIndex, filename.length)

  const hash = Math.random().toString(36).substr(2);
  return `${prefix}.${hash}${suffix}`
}

export default filenameHandle
