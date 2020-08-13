const filenameHandle = (filename) => {

  const splitIndex = filename.lastIndexOf('.')
  const prefix = filename.substr(0, splitIndex)
  const suffix = filename.substr(splitIndex, filename.length)


  // const now = new Date()
  // const y = now.getFullYear()
  // const m = now.getMonth() + 1
  // const d = now.getDate()
  // const ymd = `${y}${m < 10 ? '0' + m : m}${d < 10 ? '0' + d : d}`;
  const hash = Math.random().toString(36).substr(2);
  return `${prefix}.${hash}${suffix}`
}

export default filenameHandle
