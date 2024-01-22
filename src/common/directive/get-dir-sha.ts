import axios from 'axios'
import { UserConfigInfoModel } from '@/common/model'
import request from '@/utils/request'

// eslint-disable-next-line consistent-return
export async function getDirSha(userConfigInfo: UserConfigInfoModel, path: string) {
  const { owner, repo, token, branch } = userConfigInfo
  try {
    // 设置 axios 请求头，使用 GitHub Token 进行身份验证
    axios.defaults.headers.common.Authorization = `Bearer ${token}`
    const pathArr = path.split('/')

    if (pathArr.length > 1) {
      pathArr.pop() // 删除数组最后一项
      const resList = await request({
        method: 'GET',
        url: `repos/${owner}/${repo}/contents/${pathArr.join('/')}`
      })
      return {
        sha: resList.find((x: any) => x.path === path)?.sha || null
      }
    }

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

    // 获取旧文件夹的信息
    const oldFolderInfo = treeResponse.data.tree.find((item: any) => item.path === path)

    return {
      sha: oldFolderInfo?.sha || null
    }
  } catch (error: any) {
    console.error('Error:', error.response.data)
    return {
      sha: null
    }
  }
}
