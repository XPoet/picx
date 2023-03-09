import { UserConfigInfoModel } from '@/common/model'
import axios from '@/utils/axios'

const README = `
# Welcome to use PicX

[PicX](https://github.com/XPoet/picx) is a simple and powerful image hosting tool. It supports image hosting services via GitHub repository.

PicX is completely open source, and you can use it for free.

If you like it, please give it a star on [GitHub](https://github.com/XPoet/picx).
        `

/**
 * 初始化一个空仓库
 * @param userConfigInfo
 */
export async function initRepo(userConfigInfo: UserConfigInfoModel) {
  const { owner, selectedRepo: repo, selectedBranch: branch } = userConfigInfo

  const initRepoLoading = ElLoading.service({
    text: '正在初始化仓库...'
  })

  // GitHub Git database API 不支持在空仓库上操作，需要先初始化空仓库
  // 仓库为空时，新建一个 README 文件来初始化仓库
  const res = await axios.put(`/repos/${owner}/${repo}/contents/README.md`, {
    message: 'Init repo via PicX(https://github.com/XPoet/picx)',
    branch,
    content: window.btoa(README)
  })

  if (res?.status === 201) {
    initRepoLoading.close()
  } else {
    ElMessage.error('仓库初始化失败')
  }
}

export async function initBranch(
  userConfigInfo: UserConfigInfoModel,
  branch: string,
  callback: any
) {
  const { owner, selectedRepo: repo, branchList } = userConfigInfo

  const initLoading = ElLoading.service({
    text: `正在新建 ${branch} 分支...`
  })

  try {
    // 1、获取现有分支的 sha
    let sha = ''
    const res1 = await axios.get(`/repos/${owner}/${repo}/git/refs/heads/${branchList[0].value}`)
    console.log('res 1 - ', res1)
    if (res1?.status === 200) {
      sha = res1.data.object.sha
    }

    if (!sha) {
      initLoading.close()
      ElMessage.error('新建分支失败')
      return
    }

    // 2、新建分支
    let newBranchSha = ''
    const res2 = await axios.post(`/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branch}`, // 新分支的名称
      sha
    })
    console.log('res2 - ', res2)

    if (res2?.status === 201) {
      newBranchSha = res2.data.object.sha
    }

    if (!newBranchSha) {
      initLoading.close()
      ElMessage.error('新建分支失败')
      return
    }

    // 3、强制更新分支
    const res3 = await axios.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      force: true,
      sha: newBranchSha
    })
    console.log('res3 - ', res3)

    if (res3.status === 200) {
      callback()
    }

    // 删除分支
    // await axios.delete(`/repos/${owner}/${repo}/git/refs/heads/${branch}`)
  } catch (err) {
    console.error(err)
  }
}
