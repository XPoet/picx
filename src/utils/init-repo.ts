import { UserConfigInfoModel } from '@/common/model'
import axios from '@/utils/axios'

// Upload picture via PicX(https://github.com/XPoet/picx)

export async function initRepo(userConfigInfo: UserConfigInfoModel) {
  console.log(userConfigInfo)
  const { owner, selectedRepos: repo } = userConfigInfo
  const res = await axios.get(`/repos/${owner}/${repo}/contents`)
  if (res.status === 200) {
    // eslint-disable-next-line no-empty
  } else if (res.status === 404) {
    // github Git database API不支持在空仓库上操作，所以需要先初始化仓库
    // 仓库为空时，新建一个readme文件来初始化仓库
    const res = await axios.put(`/repos/${owner}/${repo}/contents/README.md`, {
      message: 'Init repo via PicX(https://github.com/XPoet/picx)',
      content: window.btoa(`
# Welcome to use PicX

[PicX](https://github.com/XPoet/picx) is a simple and powerful image hosting tool. It supports image hosting services via GitHub repository.

PicX is completely open source, and you can use it for free.

If you like it, please give it a star on GitHub.

Thank you for your support!
        `)
    })

    if (res?.status !== 201) {
      throw new Error('初始化仓库失败')
    }
  } else {
    throw new Error('获取仓库信息失败')
  }
}
