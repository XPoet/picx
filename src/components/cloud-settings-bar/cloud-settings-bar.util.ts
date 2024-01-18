import request from '@/utils/request'
import { PICX_INIT_SETTINGS_MSG, PICX_UPDATE_SETTINGS_MSG } from '@/common/constant'
import { UserConfigInfoModel, UserSettingsModel } from '@/common/model'

const filename = '.settings'

export const getCloudSettings = async (userConfigInfo: UserConfigInfoModel) => {
  const { owner, repo } = userConfigInfo
  const res = await request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'GET',
    noShowErrMsg: true,
    noCache: true
  })

  return Promise.resolve(res)
}

export const saveCloudSettings = async (
  userSettings: UserSettingsModel,
  userConfigInfo: UserConfigInfoModel
) => {
  const { owner, repo, branch } = userConfigInfo

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
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'PUT',
    data,
    noShowErrMsg: true
  })

  return Promise.resolve(res2)
}
