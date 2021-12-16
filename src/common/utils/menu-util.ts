import { ElMessageBox, ElMessage } from 'element-plus'
import axios from '@/common/utils/axios'
import { UserConfigInfoModel } from '@/common/model/userConfigInfo.model'

const addFolder = (userConfigInfo: UserConfigInfoModel) => {
  console.log(userConfigInfo.selectedDir)

  return new Promise<Number>((resolve, reject) => {
    let selectedDir: String = ''
    if (userConfigInfo.selectedDir === '/') {
      selectedDir = userConfigInfo.selectedDir
    } else {
      selectedDir = '/' + userConfigInfo.selectedDir + '/'
    }
    console.log(selectedDir)
    ElMessageBox.prompt('请填写文件夹名称', '新建文件夹', {
      confirmButtonText: '确认新建',
      cancelButtonText: '取消',
      inputPattern: /^[^\\\\\\/:*?\\"<>|]+$/,
      inputErrorMessage: '非法格式'
    })
      .then(async ({ value }) => {
        const newFolder = `/repos/${userConfigInfo.owner}/${userConfigInfo.selectedRepos}/contents${selectedDir}${value}/init`
        const { selectedBranch, email, owner } = userConfigInfo
        const data: any = {
          message: 'Upload pictures via PicX(https://github.com/XPoet/picx)',
          branch: selectedBranch,
          content: '5q2k5paH5pys55So5LqO5Yib5bu65paH5Lu25aS5'
        }

        if (email) {
          data.committer = {
            name: owner,
            email
          }
        }

        await axios.put(newFolder, data).then((res) => {
          if (res && res.status === 201) {
            // eslint-disable-next-line no-use-before-define
            ElMessage({
              type: 'success',
              message: `新建成功`
            })
            resolve(200)
          } else {
            // eslint-disable-next-line no-param-reassign
            ElMessage({
              type: 'error',
              message: `新建失败:${res.statusText}`
            })
            resolve(400)
          }
        })
      })
      .catch((error) => {
        resolve(400)
      })
  })
}

const deleteFolder = (userConfigInfo: UserConfigInfoModel, item: any) => {
  return new Promise<Number>((resolve, reject) => {
    axios
      .get(
        `/repos/${userConfigInfo.owner}/${userConfigInfo.selectedRepos}/contents/${item.path}`
      )
      .then(async (res) => {
        if (res.data.length === 1) {
          ElMessageBox.prompt(`请填写文件夹名称【${item.name}】确认删除`, '删除文件夹', {
            confirmButtonText: '确认删除',
            cancelButtonText: '取消',
            inputPattern: /^[^\\\\\\/:*?\\"<>|]+$/,
            inputErrorMessage: '非法格式'
          })
            .then(async ({ value }) => {
              if (value === item.name) {
                const path = `/repos/${userConfigInfo.owner}/${userConfigInfo.selectedRepos}/contents/${res.data[0].path}`
                const { selectedBranch, email, owner } = userConfigInfo

                const data: any = {
                  message: 'Remove pictures via PicX(https://github.com/XPoet/picx)',
                  branch: selectedBranch,
                  sha: res.data[0].sha
                }

                if (email) {
                  data.committer = {
                    name: owner,
                    email: email
                  }
                }

                await axios.delete(path, { data }).then((res: any) => {
                  if (res && res.content == null) {
                    // eslint-disable-next-line no-use-before-define
                    ElMessage({
                      type: 'success',
                      message: `删除成功`
                    })
                    resolve(200)
                  } else {
                    // eslint-disable-next-line no-param-reassign
                    ElMessage({
                      type: 'error',
                      message: `删除失败:${res.statusText}`
                    })
                    resolve(400)
                  }
                })
              } else {
                // eslint-disable-next-line no-param-reassign
                ElMessage({
                  type: 'warning',
                  message: `验证失败`
                })
                resolve(400)
              }
            })
            .catch((error) => {
              resolve(400)
            })
        } else {
          ElMessage({
            type: 'warning',
            message: `你需要先删除文件夹内的所有图片`
          })
          resolve(400)
        }
      })
  })
}

const openImageDetail = (image: any) => {
  ElMessageBox.alert(
    `
   <div class="message-box">
  <div class="title">文件属性</div>
  <div class="item"> <div class="label"> 文件名 </div> <div class="content"> ${image.name}</div></div>
  <div  class="item"> <div class="label"> 大小 </div><div class="content"> ${image.size}</div></div>
  <div  class="item col"> <div class="label"> CDN链接 </div><div class="content"> ${image.cdn_url}</div></div>
  <div  class="item col">  <div class="label"> Github链接  </div><div class="content"> ${image.github_url}</div> </div>
  <div  class="item col"> <div class="label"> Markdown格式Github链接 </div><div class="content"> ${image.md_gh_url}</div></div>
  <div  class="item col">  <div class="label"> Markdown格式CDN链接  </div><div class="content"> ${image.md_cdn_url}</div> </div></div>
  `,
    {
      dangerouslyUseHTMLString: true
    }
  )
}
const copyGithubUrl = (image: any) => {
  const externalLink = image.github_url

  let externalLinkDom: any = document.querySelector('.temp-external-link')
  if (!externalLinkDom) {
    externalLinkDom = document.createElement('textarea')
    externalLinkDom.setAttribute('class', 'temp-external-link')
    externalLinkDom.style.position = 'absolute'
    externalLinkDom.style.top = '-99999rem'
    externalLinkDom.style.left = '-99999rem'
    document.body.appendChild(externalLinkDom)
  }

  externalLinkDom.value = externalLink
  externalLinkDom.select()
  document.execCommand('copy')
  ElMessage.success(`Github外链复制成功！`)
}

const copyCDNUrl = (image: any) => {
  const externalLink = image.cdn_url

  let externalLinkDom: any = document.querySelector('.temp-external-link')
  if (!externalLinkDom) {
    externalLinkDom = document.createElement('textarea')
    externalLinkDom.setAttribute('class', 'temp-external-link')
    externalLinkDom.style.position = 'absolute'
    externalLinkDom.style.top = '-99999rem'
    externalLinkDom.style.left = '-99999rem'
    document.body.appendChild(externalLinkDom)
  }

  externalLinkDom.value = externalLink
  externalLinkDom.select()
  document.execCommand('copy')
  ElMessage.success(`CDN外链复制成功！`)
}

const copyMarkdownCDNUrl = (image: any) => {
  const externalLink = image.md_cdn_url

  let externalLinkDom: any = document.querySelector('.temp-external-link')
  if (!externalLinkDom) {
    externalLinkDom = document.createElement('textarea')
    externalLinkDom.setAttribute('class', 'temp-external-link')
    externalLinkDom.style.position = 'absolute'
    externalLinkDom.style.top = '-99999rem'
    externalLinkDom.style.left = '-99999rem'
    document.body.appendChild(externalLinkDom)
  }

  externalLinkDom.value = externalLink
  externalLinkDom.select()
  document.execCommand('copy')
  ElMessage.success(`Markdown CDN外链复制成功！`)
}

const copyMarkdownGithubUrl = (image: any) => {
  const externalLink = image.md_gh_url

  let externalLinkDom: any = document.querySelector('.temp-external-link')
  if (!externalLinkDom) {
    externalLinkDom = document.createElement('textarea')
    externalLinkDom.setAttribute('class', 'temp-external-link')
    externalLinkDom.style.position = 'absolute'
    externalLinkDom.style.top = '-99999rem'
    externalLinkDom.style.left = '-99999rem'
    document.body.appendChild(externalLinkDom)
  }

  externalLinkDom.value = externalLink
  externalLinkDom.select()
  document.execCommand('copy')
  ElMessage.success(`Markdown Github外链复制成功！`)
}

const openFolderDetail = (folder: any) => {
  ElMessageBox.alert(
    `
    <div class="message-box">
   <div class="title">文件属性</div>
   <div class="item"> <div class="label"> 文件名 </div> <div class="content"> ${folder.name}</div></div>
   <div  class="item">  <div class="label"> 路径  </div><div class="content"> ${folder.path}</div> </div></div>
  `,
    {
      dangerouslyUseHTMLString: true
    }
  )
}

const deleteImage = (userConfigInfo: UserConfigInfoModel, item: any) => {
  return new Promise<Number>((resolve, reject) => {
    const path = `/repos/${userConfigInfo.owner}/${userConfigInfo.selectedRepos}/contents/${item.path}`
    const { selectedBranch, email, owner } = userConfigInfo

    const data: any = {
      message: 'Remove pictures via PicX(https://github.com/XPoet/picx)',
      branch: selectedBranch,
      sha: item.sha
    }

    if (email) {
      data.committer = {
        name: owner,
        email: email
      }
    }

    axios.delete(path, { data }).then((res: any) => {
      if (res && res.content == null) {
        // eslint-disable-next-line no-use-before-define
        ElMessage({
          type: 'success',
          message: `删除成功`
        })
        resolve(200)
      } else {
        // eslint-disable-next-line no-param-reassign
        ElMessage({
          type: 'error',
          message: `删除失败:${res.statusText}`
        })
        resolve(400)
      }
    })
  })
}
export default {
  addFolder,
  deleteFolder,
  openFolderDetail,
  openImageDetail,
  copyGithubUrl,
  copyCDNUrl,
  copyMarkdownCDNUrl,
  copyMarkdownGithubUrl,
  deleteImage
}
