import { computed } from 'vue'
import request from '@/utils/request'
import { store } from '@/stores'
import { getBase64ByImageUrl, getFileSuffix, isImage } from '@/utils'
import {
  createCommit,
  createRef,
  createTree,
  getBranchInfo,
  getFileBlob,
  getRepoPathContent
} from '@/common/api'
import i18n from '@/plugins/vue/i18n'

let idx = 0
let count = 0
const repoImgList: any[] = []

/**
 * 获取原图床仓库的图片资源
 * @param sourceRepo
 * @param sourceRepoBranch
 * @param path
 * @param cb
 */
export const getSourceRepoImgContent = async (
  sourceRepo: string,
  sourceRepoBranch: string,
  path: string,
  cb?: any
) => {
  const { owner } = computed(() => store.getters.getUserConfigInfo).value

  const res = await request({
    method: 'GET',
    noShowErrMsg: true,
    url: `repos/${owner}/${sourceRepo}/contents/${path}`,
    params: {
      ref: sourceRepoBranch
    }
  })

  idx += 1

  if (!res) {
    // eslint-disable-next-line no-unused-expressions
    cb && cb({ status: false, imgList: repoImgList })
    return
  }

  if (Array.isArray(res) && res.length) {
    count += res.length
    // eslint-disable-next-line no-restricted-syntax
    for (const ri of res) {
      await getSourceRepoImgContent(sourceRepo, sourceRepoBranch, ri.path)
    }
  }

  if (res?.type === 'dir') {
    await getSourceRepoImgContent(sourceRepo, sourceRepoBranch, res.path)
  }

  if (res?.type === 'file') {
    if (isImage(res.name)) {
      let content: string = res?.content
      if (!content) {
        const tmpRes: any = await getBase64ByImageUrl(res.download_url, getFileSuffix(res.name))
        const base64 = tmpRes?.split(',')[1]
        if (base64) {
          content = base64
        }
      }
      repoImgList.push({
        name: res.name,
        path: res.path,
        content,
        sha: res.sha,
        download_url: res.download_url
      })
    }
  }

  if (idx > count) {
    // eslint-disable-next-line no-unused-expressions
    cb && cb({ status: true, imgList: repoImgList })
  }
}

/**
 * 上传原图床仓库的图片到当前仓库
 * @param imgs
 * @param sourceRepo
 */
export const uploadSourceRepoImages = async (imgs: any[], sourceRepo: string) => {
  const { branch, repo, owner } = computed(() => store.getters.getUserConfigInfo).value

  const blobs = []
  // eslint-disable-next-line no-restricted-syntax
  for (const img of imgs) {
    const blobRes: any = await getFileBlob(img.content, owner, repo)
    if (blobRes) {
      blobs.push({ img, ...blobRes })
    } else {
      ElMessage.error(i18n.global.t('upload_page.tip_11', { name: img.name }))
    }
  }

  const branchRes: any = await getBranchInfo(owner, repo, branch)
  if (!branchRes) {
    return Promise.resolve(false)
  }

  const treeRes: any = await createTree(
    owner,
    repo,
    blobs.map((x: any) => ({
      sha: x.sha,
      path: x.img.path
    })),
    branchRes
  )
  if (!treeRes) {
    return Promise.resolve(false)
  }

  const commitRes: any = await createCommit(
    owner,
    repo,
    treeRes,
    branchRes,
    `Copy \`${sourceRepo}\` image${imgs.length ? 's' : ''} via PicX (https://github.com/XPoet/picx)`
  )
  if (!commitRes) {
    return Promise.resolve(false)
  }

  const refRes = await createRef(owner, repo, branch, commitRes.sha)
  if (!refRes) {
    return Promise.resolve(false)
  }

  return Promise.resolve(true)
}

/**
 * 刷新图床管理页面，获取最新数据
 */
export const refreshManagementPage = async () => {
  const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

  const viewDir = '/'
  await store.dispatch('SET_USER_CONFIG_INFO', {
    viewDir
  })
  await store.dispatch('DIR_IMAGE_LIST_INIT_DIR', viewDir)
  await getRepoPathContent(userConfigInfo, viewDir)
}
