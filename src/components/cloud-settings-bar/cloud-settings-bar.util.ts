import request from '@/utils/request'
import { PICX_INIT_SETTINGS_MSG, PICX_UPDATE_SETTINGS_MSG } from '@/common/constant'
import { UserConfigInfoModel, UserSettingsModel } from '@/common/model'

export const getCloudSettings = async (userConfigInfo: UserConfigInfoModel) => {
  const { owner, selectedRepo: repo } = userConfigInfo
  const res = await request({
    url: `/repos/${owner}/${repo}/contents/.settings`,
    method: 'GET',
    noShowErrorMsg: true,
    cache: {
      maxAge: 0
    },
    params: {
      timestamp: Date.now() // 添加时间戳参数，防止获取缓存的数据
    }
  })

  return Promise.resolve(res)
}

export const saveCloudSettings = async (
  userSettings: UserSettingsModel,
  userConfigInfo: UserConfigInfoModel
) => {
  const { owner, selectedRepo: repo, selectedBranch: branch } = userConfigInfo

  const res = await getCloudSettings(userConfigInfo)

  const data: any = {
    message: res ? PICX_UPDATE_SETTINGS_MSG : PICX_INIT_SETTINGS_MSG,
    content: window.btoa(JSON.stringify(userSettings))
  }

  if (res) {
    data.sha = res.sha
  } else {
    data.branch = branch
  }

  const res2 = await request({
    url: `/repos/${owner}/${repo}/contents/.settings`,
    method: 'PUT',
    data,
    noShowErrorMsg: true
  })

  return Promise.resolve(res2)
}
