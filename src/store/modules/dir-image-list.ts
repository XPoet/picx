import {
  PICX_MANAGEMENT
} from '../../common/model/model'
import { Store } from "vuex";

const initDirImageList = () => {
  let dirImageList = localStorage.getItem(PICX_MANAGEMENT)
  return dirImageList ? JSON.parse(dirImageList) : []
}

export default {

  state: () => ({
    dirImageList: initDirImageList(),
  }),

  mutations: {},

  actions: {
    // 图床管理 - 增加图片
    DIR_IMAGE_LIST_ADD_IMAGE(store: Store<any>, item: any) {
      const temp = store.state.dirImageList.find((v: any) => v.dir === item.dir)
      if (temp) {
        temp.imageList.push(item)
        store.dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 往指定目录增加图片列表
    DIR_IMAGE_LIST_ADD_IMAGE_LIST(store: Store<any>, dirImageItem: any) {
      const temp = store.state.dirImageList.find((v: any) => v.dir === dirImageItem.dir)
      if (temp) {
        temp.imageList = dirImageItem.imageList
      } else {
        store.state.dirImageList.push(dirImageItem)
      }
      store.dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 增加目录
    DIR_IMAGE_LIST_ADD_DIR(store: Store<any>, dir: string) {
      if (!store.state.dirImageList.some((v: any) => v.dir === dir)) {
        const dirObj = {dir: dir, imageList: []}

        if (dir === '/') {
          store.state.dirImageList.unshift(dirObj)
        } else {
          store.state.dirImageList.push(dirObj)
        }
        store.dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 删除目录
    DIR_IMAGE_LIST_REMOVE_DIR(store: Store<any>, dir: string) {
      if (store.state.dirImageList.some((v: any) => v.dir === dir)) {
        const rmIndex = store.state.dirImageList.findIndex((v: any) => v.dir === dir)
        // 删除目录
        store.state.dirImageList.splice(rmIndex, 1)
        store.dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 删除指定目录里的指定图片
    DIR_IMAGE_LIST_REMOVE(store: Store<any>, item: any) {
      if (store.state.dirImageList.length > 0) {
        const temp = store.state.dirImageList.find((v: any) => v.dir === item.dir)
        if (temp) {
          const rmIndex = temp.imageList.findIndex((v: any) => v.uuid === item.uuid)
          if (rmIndex !== -1) {

            // 删除图片
            temp.imageList.splice(rmIndex, 1)

            // 如果 imageList.length 为 0，需删除该目录
            if (temp.imageList.length === 0) {

              // userConfigInfo.dirList 中删除目录
              store.dispatch('DIR_IMAGE_LIST_REMOVE_DIR', temp.dir)

              // dirImageList 中删除目录
              store.dispatch('USER_CONFIG_INFO_REMOVE_DIR', temp.dir)
            }

            store.dispatch('DIR_IMAGE_LIST_PERSIST')
          }
        }
      }
    },

    // 图床管理 - 持久化存储
    DIR_IMAGE_LIST_PERSIST(store: Store<any>) {
      localStorage.setItem(PICX_MANAGEMENT, JSON.stringify(store.state.dirImageList))
    },

    // 图床管理 - 退出登录
    DIR_IMAGE_LOGOUT(store: Store<any>) {
      store.state.dirImageList = []
      localStorage.removeItem(PICX_MANAGEMENT)
    },
  },

  getters: {
    getDirImageList: (state: any) => state.dirImageList
  }
}
