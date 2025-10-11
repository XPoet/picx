import { Module } from 'vuex'
import { ImageCardStateTypes } from './types'
import RootStateTypes from '../../types'
import { UploadedImageModel } from '@/common/model'

const imageCardModule: Module<ImageCardStateTypes, RootStateTypes> = {
  state: {
    imgCardArr: [],
    videoCardArr: []
  },
  mutations: {
    IMAGE_CARD(state: ImageCardStateTypes, { imageObj }) {
      const { uuid, checked } = imageObj
      if (checked) {
        state.imgCardArr.forEach((item) => {
          if (item.uuid === uuid) {
            // eslint-disable-next-line no-param-reassign
            item.checked = true
          }
        })
      }
    },
    VIDEO_CARD(state: ImageCardStateTypes, { videoObj }) {
      const { uuid, checked } = videoObj
      if (checked) {
        state.videoCardArr.forEach((item) => {
          if (item.uuid === uuid) {
            // eslint-disable-next-line no-param-reassign
            item.checked = true
          }
        })
      }
    },
    REPLACE_IMAGE_CARD(state: ImageCardStateTypes, { checkedImgArr }) {
      if (checkedImgArr.length > 0) {
        state.imgCardArr = checkedImgArr
      } else {
        state.imgCardArr = []
      }
    },
    REPLACE_VIDEO_CARD(state: ImageCardStateTypes, { checkedVideoArr }) {
      if (checkedVideoArr.length > 0) {
        state.videoCardArr = checkedVideoArr
      } else {
        state.videoCardArr = []
      }
    }
  },
  actions: {},
  getters: {
    getImageCardArr: (state: ImageCardStateTypes) => state.imgCardArr,
    getVideoCardArr: (state: ImageCardStateTypes) => state.videoCardArr,
    getImageCardCheckedArr: (state: ImageCardStateTypes) => {
      return state.imgCardArr.filter((item: UploadedImageModel) => {
        return item.checked
      })
    },
    getVideoCardCheckedArr: (state: ImageCardStateTypes) => {
      return state.videoCardArr.filter((item) => {
        return item.checked
      })
    }
  }
}

export default imageCardModule
