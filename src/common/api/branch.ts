import axios from '@/utils/axios'
import { UserConfigInfoModel } from '@/common/model'

/**
 * 获取分支信息列表
 * @param owner
 * @param repo
 * @param callback
 */
export const getBranchInfoList = <T extends (...args: any) => void>(
  owner: string,
  repo: string,
  callback: T
) => {
  axios
    .get(`/repos/${owner}/${repo}/branches`)
    .then(async (res: any) => {
      console.log('getBranchList >> ', res)
      if (res && res.status === 200) {
        callback(res.data)
      } else {
        callback(null)
      }
    })
    .catch(() => {
      callback(null)
    })
}

/**
 * 初始化空分支（未实现，待完善）
 * @param userConfigInfo
 * @param branch
 * @param callback
 */
export const initBranch = async (
  userConfigInfo: UserConfigInfoModel,
  branch: string,
  callback: any
) => {
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
