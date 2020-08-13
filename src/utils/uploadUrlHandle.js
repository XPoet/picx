const uploadUrlHandle = (config, filename) => {

  const baseUrl = 'https://api.github.com/repos'

  let path = config.path

  if (!config.path) {

    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const d = now.getDate()
    path = `${y}${m < 10 ? '0' + m : m}${d < 10 ? '0' + d : d}`;
  }

  return `${baseUrl}/${config.username}/${config.repository}/contents/${path}/${filename}`

}

export default uploadUrlHandle
