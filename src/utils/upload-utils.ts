import { ToUploadImageModel, UploadedImageModel, UserConfigInfoModel } from '@/common/model'
import axios from '@/utils/axios'
import { store } from '@/store'

const uploadedHandle = (
  res: { name: string; sha: string; path: string; size: number },
  img: ToUploadImageModel,
  userConfigInfo: UserConfigInfoModel
) => {
  let dir = userConfigInfo.selectedDir

  if (img.reUploadInfo.isReUpload) {
    dir = img.reUploadInfo.dir
  }

  // 上传状态处理
  img.uploadStatus.progress = 100
  img.uploadStatus.uploading = false

  const item: UploadedImageModel = {
    checked: false,
    type: 'image',
    uuid: img.uuid,
    dir,
    name: res.name,
    sha: res.sha,
    path: res.path,
    deleting: false,
    size: res.size
  }

  img.uploadedImg = item

  // uploadedList 增加图片
  store.dispatch('UPLOADED_LIST_ADD', item)

  // dirImageList 增加目录
  store.dispatch('DIR_IMAGE_LIST_ADD_DIR', dir)

  // dirImageList 增加图片
  store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item)
}

export const uploadUrlHandle = (
  config: UserConfigInfoModel,
  imgObj: ToUploadImageModel
): string => {
  const { owner, selectedRepo: repo, selectedDir: dir } = config
  const filename: string = imgObj.filename.final

  let path = filename

  if (dir !== '/') {
    path = `${dir}/${filename}`
  }

  if (imgObj.reUploadInfo.isReUpload) {
    path = imgObj.reUploadInfo.path
  }

  return `/repos/${owner}/${repo}/contents/${path}`
}

export async function uploadImagesToGitHub(
  userConfigInfo: UserConfigInfoModel,
  imgs: ToUploadImageModel[]
): Promise<void> {
  const { selectedBranch: branch, selectedRepo: repo, selectedDir, owner } = userConfigInfo

  imgs.forEach((img) => {
    img.uploadStatus.uploading = true
  })

  // 上传图片文件，为仓库创建 blobs
  let blobs = await Promise.all(
    imgs.map((img) => {
      return axios
        .post(`/repos/${owner}/${repo}/git/blobs`, {
          owner,
          repo,
          content: img.imgData.base64Content,
          encoding: 'base64'
        })
        .then((res) => {
          if (res && res.status === 201) {
            // 已上传数量 +1
            store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
          } else {
            img.uploadStatus.uploading = false
            ElMessage.error(`${img.filename.final} 上传失败`)
          }
          return { img, ...res }
        })
    })
  )

  // 获取 head，用于获取当前分支信息（根目录的 tree sha 以及 head commit sha）
  const head = await axios.get(`/repos/${owner}/${repo}/branches/${branch}`)
  if (head?.status !== 200) {
    throw new Error('获取分支信息失败')
  }

  blobs = blobs.filter((x) => x.status === 201)
  const tgtPath = selectedDir === '/' ? '' : `${selectedDir}/`

  // 创建 tree
  const tree = await axios.post(`/repos/${owner}/${repo}/git/trees`, {
    tree: blobs.map((blob) => ({
      path: `${tgtPath}${blob.img.filename.final}`,
      mode: '100644',
      type: 'blob',
      sha: blob.data.sha
    })),
    base_tree: head.data?.commit?.commit?.tree?.sha || null
  })
  if (tree?.status !== 201) {
    throw new Error('创建 tree 失败')
  }

  // 创建 commit 节点
  const commit = await axios.post(`/repos/${owner}/${repo}/git/commits`, {
    tree: tree.data.sha,
    parents: [head.data.commit.sha],
    message: 'Upload images via PicX(https://github.com/XPoet/picx)'
  })
  if (commit?.status !== 201) {
    throw new Error('创建 commit 失败')
  }

  // 将当前分支 ref 指向新创建的 commit
  const refRes = await axios.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commit.data.sha
  })
  if (refRes?.status !== 200) {
    throw new Error('更新 ref 失败')
  }

  blobs.forEach((blob) => {
    const name = blob.img.filename.final
    uploadedHandle(
      { name, sha: blob.data.sha, path: `${tgtPath}${name}`, size: 0 },
      blob.img,
      userConfigInfo
    )
  })
}

export function uploadImageToGitHub(
  userConfigInfo: UserConfigInfoModel,
  img: ToUploadImageModel
): Promise<Boolean> {
  const { selectedBranch: branch, email, owner } = userConfigInfo

  const data: any = {
    message: 'Upload image via PicX(https://github.com/XPoet/picx)',
    branch,
    content: img.imgData.base64Content
  }

  if (email) {
    data.committer = {
      name: owner,
      email
    }
  }

  img.uploadStatus.uploading = true

  return new Promise((resolve, reject) => {
    axios
      .put(uploadUrlHandle(userConfigInfo, img), data)
      .then((res) => {
        console.log('uploadImage >> ', res)
        if (res && res.status === 201) {
          const { name, sha, path, size } = res.data.content
          uploadedHandle({ name, sha, path, size }, img, userConfigInfo)
          store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
          resolve(true)
        } else {
          img.uploadStatus.uploading = false
          resolve(false)
        }
      })
      .catch((error) => {
        reject(error)
      })
  })
}
