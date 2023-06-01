import { Module } from 'vuex'
import RootStateTypes from '@/stores/types'
import UploadImageListStateTypes from './types'
import { UploadImageModel } from '@/common/model'

const uploadImageListModule: Module<UploadImageListStateTypes, RootStateTypes> = {
  state: {
    uploadImageList: []
  },

  mutations: {},

  actions: {
    // 上传处理的图片列表 - 增加
    UPLOAD_IMG_LIST_ADD({ state }, item: UploadImageModel) {
      state.uploadImageList.unshift(item)
    },

    // 上传处理的图片列表 - 删除
    UPLOAD_IMG_LIST_REMOVE({ state }, uuid: string) {
      if (state.uploadImageList.length > 0) {
        const rmIdx = state.uploadImageList.findIndex((v) => v.uuid === uuid)
        if (rmIdx !== -1 && state.uploadImageList[rmIdx].uploadStatus.progress === 0) {
          state.uploadImageList.splice(rmIdx, 1)
        }
      }
    },

    // 上传处理的图片列表 - 重置
    UPLOAD_IMG_LIST_RESET({ state }) {
      state.uploadImageList = []
    }
  },

  getters: {
    getUploadImageList: (state): UploadImageModel[] => state.uploadImageList
  }
}

export default uploadImageListModule
