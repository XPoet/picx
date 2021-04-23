import { PICX_UPLOADED } from '../../common/model/localStorage.model'
import { Store } from 'vuex'

const initUploadedImageList = () => {
  let imageList = sessionStorage.getItem(PICX_UPLOADED)
  return imageList ? JSON.parse(imageList) : []
}

// 上传完成的图片列表
export default {
  state: () => ({
    uploadedImageList: initUploadedImageList()
  }),

  mutations: {},

  actions: {
    // 上传完成的图片列表 - 增加
    UPLOADED_LIST_ADD(store: Store<any>, item: any) {
      store.state.uploadedImageList.unshift(item)
      store.dispatch('UPLOADED_LIST_PERSIST')
    },

    // 上传完成的图片列表 - 删除
    UPLOADED_LIST_REMOVE(store: Store<any>, item: any) {
      if (store.state.uploadedImageList.length > 0) {
        const rmIndex = store.state.uploadedImageList.findIndex(
          (v: any) => v.uuid === item.uuid
        )
        if (rmIndex !== -1) {
          store.state.uploadedImageList.splice(rmIndex, 1)
          store.dispatch('UPLOADED_LIST_PERSIST')
        }
      }
    },

    // 上传完成的图片列表 - 持久化
    UPLOADED_LIST_PERSIST(store: Store<any>) {
      sessionStorage.setItem(
        PICX_UPLOADED,
        JSON.stringify(store.state.uploadedImageList)
      )
    },

    // 上传完成的图片列表 - 退出登录
    UPLOADED_LIST_LOGOUT(store: Store<any>) {
      store.state.uploadedImageList = []
      sessionStorage.removeItem(PICX_UPLOADED)
    }
  },

  getters: {
    getUploadedImageList: (state: any) => state.uploadedImageList
  }
}
