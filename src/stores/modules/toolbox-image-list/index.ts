import type { Module } from 'vuex'
import type ToolboxImageListStateTypes from './types'
import type { ImgProcessStateModel } from '@/common/model'
import type RootStateTypes from '@/stores/types'

const toolboxImageListModule: Module<ToolboxImageListStateTypes, RootStateTypes> = {
  state: {
    toolboxImageList: [],
  },

  mutations: {},

  actions: {
    // 工具箱图片列表 - 增加
    TOOLBOX_IMG_LIST_ADD({ state }, item: ImgProcessStateModel) {
      state.toolboxImageList.unshift(item)
    },

    // 工具箱图片列表 - 删除
    TOOLBOX_IMG_LIST_REMOVE({ state }, uuid: string) {
      if (state.toolboxImageList.length > 0) {
        const rmIdx = state.toolboxImageList.findIndex((v) => v.uuid === uuid)
        if (rmIdx !== -1) {
          state.toolboxImageList.splice(rmIdx, 1)
        }
      }
    },

    // 工具箱图片列表 - 重置
    TOOLBOX_IMG_LIST_RESET({ state }) {
      state.toolboxImageList = []
    },
  },

  getters: {
    getToolboxImageList: (state: any) => state.toolboxImageList,
  },
}

export default toolboxImageListModule
