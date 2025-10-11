import { Module } from 'vuex'
import RootStateTypes from '@/stores/types'
import UploadVideoListStateTypes from './types'
import { UploadVideoModel } from '@/common/model'

const uploadVideoListModule: Module<UploadVideoListStateTypes, RootStateTypes> = {
  state: {
    uploadVideoList: []
  },

  mutations: {},

  actions: {
    // 上传处理的图片列表 - 增加
    UPLOAD_VIDEO_LIST_ADD({ state }, item: UploadVideoModel) {
      state.uploadVideoList.unshift(item)
    },

    // 上传处理的图片列表 - 删除
    UPLOAD_VIDEO_LIST_REMOVE({ state }, uuid: string) {
      if (state.uploadVideoList.length > 0) {
        const rmIdx = state.uploadVideoList.findIndex((v) => v.uuid === uuid)
        if (rmIdx !== -1 && state.uploadVideoList[rmIdx].uploadStatus.progress === 0) {
          state.uploadVideoList.splice(rmIdx, 1)
        }
      }
    },

    // 上传处理的图片列表 - 重置
    UPLOAD_VIDEO_LIST_RESET({ state }) {
      state.uploadVideoList = []
    }
  },

  getters: {
    getUploadVideoList: (state): UploadVideoModel[] => state.uploadVideoList
  }
}

export default uploadVideoListModule
