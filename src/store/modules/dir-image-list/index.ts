import { Module } from 'vuex'
import { PICX_MANAGEMENT } from '@/common/model/localStorage.model'
import DirImageListStateTypes from './types'
import RootStateTypes from '../../types'

const initDirImageList = () => {
  const dirImageList = localStorage.getItem(PICX_MANAGEMENT)
  return dirImageList ? JSON.parse(dirImageList) : []
}

const dirImageListModule: Module<DirImageListStateTypes, RootStateTypes> = {
  state: {
    name: 'dirImageListModule',
    dirImageList: initDirImageList()
  },

  mutations: {},

  actions: {
    // 图床管理 - 增加图片
    DIR_IMAGE_LIST_ADD_IMAGE({ state, dispatch }, item: any) {
      const temp = state.dirImageList.find((v: any) => v.dir === item.dir)
      if (temp) {
        temp.imageList.push(item)
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 往指定目录增加图片列表
    DIR_IMAGE_LIST_ADD_IMAGE_LIST({ state, dispatch }, dirImageItem: any) {
      const temp = state.dirImageList.find((v: any) => v.dir === dirImageItem.dir)
      if (temp) {
        temp.imageList = dirImageItem.imageList
      } else {
        state.dirImageList.unshift(dirImageItem)
      }
      dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 增加目录
    DIR_IMAGE_LIST_ADD_DIR({ state, dispatch }, dir: string) {
      if (!state.dirImageList.some((v: any) => v.dir === dir)) {
        const dirObj = { dir, imageList: [] }

        if (dir === '/') {
          state.dirImageList.unshift(dirObj)
        } else {
          state.dirImageList.push(dirObj)
        }
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 删除目录
    DIR_IMAGE_LIST_REMOVE_DIR({ state, dispatch }, dir: string) {
      if (state.dirImageList.some((v: any) => v.dir === dir)) {
        const rmIndex = state.dirImageList.findIndex((v: any) => v.dir === dir)
        // 删除目录
        state.dirImageList.splice(rmIndex, 1)
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 删除指定目录里的指定图片
    DIR_IMAGE_LIST_REMOVE({ state, dispatch }, item: any) {
      if (state.dirImageList.length > 0) {
        const temp = state.dirImageList.find((v: any) => v.dir === item.dir)
        if (temp) {
          const rmIndex = temp.imageList.findIndex((v: any) => v.uuid === item.uuid)
          if (rmIndex !== -1) {
            // 删除图片
            temp.imageList.splice(rmIndex, 1)

            // 如果 imageList.length 为 0，需删除该目录
            if (temp.imageList.length === 0) {
              // userConfigInfo.dirList 中删除目录
              dispatch('DIR_IMAGE_LIST_REMOVE_DIR', temp.dir)

              // dirImageList 中删除目录
              dispatch('USER_CONFIG_INFO_REMOVE_DIR', temp.dir)
            }
            dispatch('DIR_IMAGE_LIST_PERSIST')
          }
        }
      }
    },

    // 图床管理 - 持久化存储
    DIR_IMAGE_LIST_PERSIST({ state }) {
      localStorage.setItem(PICX_MANAGEMENT, JSON.stringify(state.dirImageList))
    },

    // 图床管理 - 退出登录
    DIR_IMAGE_LOGOUT({ state }) {
      state.dirImageList = []
      localStorage.removeItem(PICX_MANAGEMENT)
    }
  },

  getters: {
    getDirImageList: (state: any) => state.dirImageList
  }
}

export default dirImageListModule
