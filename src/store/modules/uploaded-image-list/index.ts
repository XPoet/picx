import { Module } from 'vuex'
import UploadedImageListStateTypes from '@/store/modules/uploaded-image-list/types'
import RootStateTypes from '@/store/types'
import { PICX_UPLOADED } from '@/common/model/storage.model'
import { UploadedImageModel } from '@/common/model/upload.model'

const initUploadedImageList = (): UploadedImageModel[] => {
  const imageList: string | null = sessionStorage.getItem(PICX_UPLOADED)
  return imageList ? JSON.parse(imageList) : []
}

const uploadedImageListModule: Module<UploadedImageListStateTypes, RootStateTypes> = {
  state: {
    uploadedImageList: initUploadedImageList()
  },

  mutations: {},

  actions: {
    // 上传完成的图片列表 - 增加
    UPLOADED_LIST_ADD({ state, dispatch }, item: UploadedImageModel) {
      state.uploadedImageList.unshift(item)
      dispatch('UPLOADED_LIST_PERSIST')
    },

    // 上传完成的图片列表 - 删除
    UPLOADED_LIST_REMOVE({ state, dispatch }, uuid: string) {
      if (state.uploadedImageList.length > 0) {
        const rmIndex = state.uploadedImageList.findIndex((v) => v.uuid === uuid)
        if (rmIndex !== -1) {
          state.uploadedImageList.splice(rmIndex, 1)
          dispatch('UPLOADED_LIST_PERSIST')
        }
      }
    },

    // 上传完成的图片列表 - 持久化
    UPLOADED_LIST_PERSIST({ state }) {
      sessionStorage.setItem(PICX_UPLOADED, JSON.stringify(state.uploadedImageList))
    },

    // 上传完成的图片列表 - 退出登录
    UPLOADED_LIST_LOGOUT({ state }) {
      state.uploadedImageList = []
    }
  },

  getters: {
    getUploadedImageList: (state: any) => state.uploadedImageList
  }
}

export default uploadedImageListModule
