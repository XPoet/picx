import {ToUploadImageModel} from '../../common/model/upload.model'
import {Store} from 'vuex'

export default {

  state: () => ({
    curImgBase64Url: '',
    list: [],
    uploadedNumber: 0
  }),

  actions: {
    // 要上传的图片列表 - 增加图片项
    TO_UPLOAD_IMAGE_LIST_ADD(store: Store<any>, item: ToUploadImageModel) {
      store.state.list.unshift(item)
    },

    // 要上传的图片列表 - 设置当前图片的 Base64Url
    TO_UPLOAD_IMAGE_SET_URL(store: Store<any>, url: string) {
      store.state.curImgBase64Url = url
    },

    // 要上传的图片列表 - 上传完成的图片数量 +1
    TO_UPLOAD_IMAGE_UPLOADED(store: Store<any>, uuid: string) {
      store.state.uploadedNumber++
    },

    // 要上传的图片列表 - 删除图片项
    TO_UPLOAD_IMAGE_LIST_REMOVE(store: Store<any>, uuid: string) {
      if (store.state.list.length > 0) {
        const rmIndex = store.state.list.findIndex((v: ToUploadImageModel) => v.uuid === uuid)
        if (rmIndex !== -1) {
          store.state.list.splice(rmIndex, 1)
        }
        if (store.state.list.length === 0) {
          store.state.curImgBase64Url = ''
          store.state.uploadedNumber = 0
        }
      }
    },

    // 要上传的图片列表 - 上传失败时，在列表中移除已上传的图片
    TO_UPLOAD_IMAGE_LIST_FAIL(store: Store<any>) {
      if (store.state.list.length > 0) {
        const temp: ToUploadImageModel[] = store.state.list.filter((v: ToUploadImageModel) => v.uploadStatus.progress !== 100)
        if (temp.length > 0) {
          store.state.list = temp
          store.state.uploadedNumber = 0
          store.state.curImgBase64Url = temp[0].imgData.base64Url
        }
      }
    },

    // 要上传的图片列表 - 清空 Url
    TO_UPLOAD_IMAGE_CLEAN_URL(store: Store<any>) {
      store.state.curImgBase64Url = ''
    },

    // 要上传的图片列表 - 清空 List
    TO_UPLOAD_IMAGE_CLEAN_LIST(store: Store<any>) {
      store.state.list = []
    },

    // 要上传的图片列表 - 清空上传完成数量
    TO_UPLOAD_IMAGE_CLEAN_UPLOADED_NUMBER(store: Store<any>) {
      store.state.uploadedNumber = 0
    },

    // 要上传的图片列表 - 退出登录
    TO_UPLOAD_IMAGE_LOGOUT(store: Store<any>) {
      store.state.curImgBase64Url = ''
      store.state.list = []
      store.state.uploadedNumber = 0
    },
  },

  getters: {
    getToUploadImageList: (state: any) => state.list,
    getToUploadImage: (state: any) => state,
  }
}
