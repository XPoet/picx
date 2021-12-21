import { computed } from 'vue'
import axios from '@/common/utils/axios'
import { store } from '@/store'
import { filenameHandle, getFileSuffix, isImage } from '@/common/utils/file-handle-helper'
import { structureImageObject } from '@/common/utils/image-helper'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

export const GetDirList = (path: string = '') => {
  return new Promise((resolve) => {
    axios
      .get(
        `/repos/${userConfigInfo.owner}/${userConfigInfo.selectedRepos}/contents/${path}`,
        {
          params: {
            ref: userConfigInfo.selectedBranch
          }
        }
      )
      .then((res: any) => {
        if (res && res.status === 200 && res.data.length > 0) {
          resolve(
            res.data
              .filter((v: any) => v.type === 'dir')
              .map((x: any) => ({
                value: x.name,
                label: x.name
              }))
          )
        } else {
          resolve(null)
        }
      })
      .catch(() => {
        resolve(null)
      })
  })
}

export const getContentByReposPath = (path: string = '') => {
  return new Promise((resolve) => {
    axios
      .get(
        `/repos/${userConfigInfo.owner}/${userConfigInfo.selectedRepos}/contents/${path}`,
        {
          params: {
            ref: userConfigInfo.selectedBranch
          }
        }
      )
      .then((res: any) => {
        console.log('[getContentByReposPath] ', res)
        if (res && res.status === 200 && res.data.length > 0) {
          res.data
            .filter((v: any) => v.type === 'dir')
            .forEach((x: any) => store.dispatch('DIR_IMAGE_LIST_ADD_DIR', x.path))

          setTimeout(() => {
            res.data
              .filter((v: any) => v.type === 'file' && isImage(getFileSuffix(v.name)))
              .forEach((x: any) =>
                store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', structureImageObject(x, path))
              )
          }, 100)

          resolve(true)
        } else {
          resolve(null)
        }
      })
      .catch(() => {
        resolve(null)
      })
  })
}
