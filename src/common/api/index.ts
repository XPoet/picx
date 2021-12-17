import { computed } from 'vue'
import axios from '@/common/utils/axios'
import { store } from '@/store'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

const GetDirList = (path: string = '') => {
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

// eslint-disable-next-line import/prefer-default-export
export { GetDirList }
