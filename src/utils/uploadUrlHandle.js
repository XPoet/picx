const uploadUrlHandle = (config, filename) => {

  const baseUrl = 'https://api.github.com/repos'

  let dir = config.selectedDir

  if (!config.selectedDir) {

    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const d = now.getDate()
    dir = `${y}${m < 10 ? '0' + m : m}${d < 10 ? '0' + d : d}`;
  }

  return `${baseUrl}/${config.username}/${config.selectedRepos}/contents/${dir}/${filename}`

}

export default uploadUrlHandle
