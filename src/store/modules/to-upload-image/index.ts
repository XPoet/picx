import { ToUploadImageModel } from '@/common/model/upload.model'
import { Module } from 'vuex'
import ToUploadImageStateTypes from '@/store/modules/to-upload-image/types'
import RootStateTypes from '@/store/types'

const toUploadImageModule: Module<ToUploadImageStateTypes, RootStateTypes> = {
  state: {
    curImgBase64Url: '',
    curImgUuid: '',
    list: [],
    uploadedNumber: 0
  },

  actions: {
    // 要上传的图片列表 - 增加图片项
    TO_UPLOAD_IMAGE_LIST_ADD({ state }, item: ToUploadImageModel) {
      state.list.unshift(item)
    },

    // 要上传的图片列表 - 设置当前图片的 Base64Url
    TO_UPLOAD_IMAGE_SET_CURRENT({ state }, { uuid, base64Url }) {
      state.curImgUuid = uuid
      state.curImgBase64Url = base64Url
    },

    // 要上传的图片列表 - 上传完成的图片数量 +1
    TO_UPLOAD_IMAGE_UPLOADED({ state }) {
      state.uploadedNumber += 1
    },

    // 要上传的图片列表 - 删除图片项
    TO_UPLOAD_IMAGE_LIST_REMOVE({ state }, uuid: string) {
      if (state.list.length > 0) {
        const rmIndex = state.list.findIndex((v: ToUploadImageModel) => v.uuid === uuid)
        if (rmIndex !== -1) {
          state.list.splice(rmIndex, 1)
        }
        if (state.list.length === 0) {
          state.curImgBase64Url = ''
          state.uploadedNumber = 0
        } else if (state.curImgUuid === uuid) {
          const cur = state.list[0]
          state.curImgBase64Url = cur.imgData.base64Url
          state.curImgUuid = cur.uuid
        }
      }
    },

    // 要上传的图片列表 - 上传失败时，在列表中移除已上传的图片
    TO_UPLOAD_IMAGE_LIST_FAIL({ state }) {
      if (state.list.length > 0) {
        const temp: ToUploadImageModel[] = state.list.filter(
          (v: ToUploadImageModel) => v.uploadStatus.progress !== 100
        )
        if (temp.length > 0) {
          state.list = temp
          state.uploadedNumber = 0
          state.curImgBase64Url = temp[0].imgData.base64Url
        }
      }
    },

    // 要上传的图片列表 - 清空 Url
    TO_UPLOAD_IMAGE_CLEAN_URL({ state }) {
      state.curImgBase64Url = ''
    },

    // 要上传的图片列表 - 清空 List
    TO_UPLOAD_IMAGE_CLEAN_LIST({ state }) {
      state.list = []
    },

    // 要上传的图片列表 - 清空上传完成数量
    TO_UPLOAD_IMAGE_CLEAN_UPLOADED_NUMBER({ state }) {
      state.uploadedNumber = 0
    },

    // 要上传的图片列表 - 退出登录
    TO_UPLOAD_IMAGE_LOGOUT({ state }) {
      state.curImgBase64Url = ''
      state.list = []
      state.uploadedNumber = 0
    }
  },

  getters: {
    getToUploadImageList: (state: ToUploadImageStateTypes) => state.list,
    getToUploadImage: (state: ToUploadImageStateTypes) => state
  }
}

export default toUploadImageModule
