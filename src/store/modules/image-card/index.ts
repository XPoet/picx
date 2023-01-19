import { Module } from 'vuex'
import { ImageCardStateTypes } from './types'
import RootStateTypes from '../../types'
import { UploadedImageModel } from '@/common/model'

const imageCardModule: Module<ImageCardStateTypes, RootStateTypes> = {
  state: {
    imgCardArr: []
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
    REPLACE_IMAGE_CARD(state: ImageCardStateTypes, { checkedImgArr }) {
      if (checkedImgArr.length > 0) {
        state.imgCardArr = checkedImgArr
      } else {
        state.imgCardArr = []
      }
    }
  },
  actions: {},
  getters: {
    getImageCardArr: (state: ImageCardStateTypes) => state.imgCardArr,
    getImageCardCheckedArr: (state: ImageCardStateTypes) => {
      return state.imgCardArr.filter((item: UploadedImageModel) => {
        return item.checked
      })
    }
  }
}

export default imageCardModule
