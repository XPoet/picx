import type { Module } from 'vuex'
import type RootStateTypes from '../../types'
import type { ImageCardStateTypes } from './types'
import type { UploadedImageModel } from '@/common/model'

const imageCardModule: Module<ImageCardStateTypes, RootStateTypes> = {
  state: {
    imgCardArr: [],
  },
  mutations: {
    IMAGE_CARD(state: ImageCardStateTypes, { imageObj }) {
      const { uuid, checked } = imageObj
      if (checked) {
        state.imgCardArr.forEach((item) => {
          if (item.uuid === uuid) {
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
  },
  actions: {},
  getters: {
    getImageCardArr: (state: ImageCardStateTypes) => state.imgCardArr,
    getImageCardCheckedArr: (state: ImageCardStateTypes) => {
      return state.imgCardArr.filter((item: UploadedImageModel) => {
        return item.checked
      })
    },
  },
}

export default imageCardModule
