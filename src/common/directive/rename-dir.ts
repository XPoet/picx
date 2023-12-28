import axios from 'axios'

export async function renameFolder(owner, repo, oldPath, newPath, token, branch) {
  try {
    // 设置 axios 请求头，使用 GitHub Token 进行身份验证
    axios.defaults.headers.common.Authorization = `Bearer ${token}`

    // 获取分支的引用
    const branchResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`
    )

    const latestCommitSha = branchResponse.data.object.sha

    // 获取最新提交的树对象 SHA
    const commitResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
    )

    const treeSha = commitResponse.data.tree.sha

    // 获取树对象的信息
    const treeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}`
    )

    console.log('treeResponse: ', treeResponse)

    // 获取旧文件夹的信息
    const oldFolderInfo = treeResponse.data.tree.find((item) => item.path === oldPath)

    if (!oldFolderInfo) {
      throw new Error('The specified path is not a directory.')
    }

    // 创建一个新的树对象，将旧文件夹的内容更新为新的路径
    const newTreeResponse = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        base_tree: treeSha,
        tree: treeResponse.data.tree.map((item) => {
          if (item.path === oldPath) {
            return {
              path: newPath,
              mode: item.mode,
              type: item.type,
              sha: item.sha
            }
          }
          return item
        })
      }
    )

    // 创建一个新的提交，将树对象更新到仓库
    const commitMessage = `Move folder from ${oldPath} to ${newPath}`
    const commitInfo = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        message: commitMessage,
        tree: newTreeResponse.data.sha,
        parents: [latestCommitSha] // 使用最新提交的 SHA 作为父提交
      }
    )

    // 更新分支的引用，将提交应用到仓库
    await axios.patch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      sha: commitInfo.data.sha
    })

    console.log('Folder renamed successfully!')
  } catch (error) {
    console.error('Error:', error.response.data)
  }
}
