import { UserConfigInfoModel } from '@/common/model'
import axios from '@/utils/axios'

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
    content: window.btoa(`
# Welcome to use PicX

[PicX](https://github.com/XPoet/picx) is a simple and powerful image hosting tool. It supports image hosting services via GitHub repository.

PicX is completely open source, and you can use it for free.

If you like it, please give it a star on [GitHub](https://github.com/XPoet/picx).
        `)
  })

  if (res?.status === 201) {
    initRepoLoading.close()
  } else {
    ElMessage.error('仓库初始化失败')
  }
}
