import { Module } from 'vuex'
import { UploadedImageModel } from '@/common/model'
import { LS_MANAGEMENT } from '@/common/constant'
import DirImageListStateTypes, { DirObject } from './types'
import RootStateTypes from '../../types'
import {
  createDirObject,
  getUpLevelDirList,
  getUpOneLevelDir
} from '@/stores/modules/dir-image-list/utils'
import { getDirContent } from '@/views/imgs-management/imgs-management.util'
import { setLocal } from '@/utils'

const initDirObject = () => {
  const dirObj = localStorage.getItem(LS_MANAGEMENT)
  return dirObj ? JSON.parse(dirObj) : createDirObject('/', '/')
}

const dirImageListModule: Module<DirImageListStateTypes, RootStateTypes> = {
  state: {
    name: 'dirImageListModule',
    dirObject: initDirObject()
  },

  mutations: {},

  actions: {
    // 图床管理 - 增加目录
    DIR_IMAGE_LIST_ADD_DIR({ state, dispatch }, dirPath: string) {
      if (dirPath === '/') {
        return
      }

      const findAssign = (dirObj: DirObject, dir: string, dirPath: string) => {
        if (dirObj) {
          if (!dirObj.childrenDirs.some((v: DirObject) => v.dir === dir)) {
            dirObj.childrenDirs.push(createDirObject(dir, dirPath))
          }
          const temp = dirObj.childrenDirs.find((x: DirObject) => x.dir === dir)
          return temp || createDirObject(dir, dirPath)
        }
        return createDirObject(dir, dirPath)
      }

      const dirList: string[] = dirPath.split('/')
      let dirPathC = ''
      let tempDirObj: DirObject = state.dirObject

      // eslint-disable-next-line no-plusplus
      for (let i = 0, len = dirList.length; i < len; i++) {
        const dirName = dirList[i]
        dirPathC += `${i > 0 ? '/' : ''}${dirName}`
        tempDirObj = findAssign(tempDirObj, dirName, dirPathC)

        if (i === 0) {
          dispatch('USER_CONFIG_INFO_ADD_DIR', dirName)
        }
      }

      dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 删除目录
    DIR_IMAGE_LIST_REMOVE_DIR({ state, dispatch }, dirPath: string) {
      if (dirPath === '/') {
        return
      }

      const rmDir = (dirObj: DirObject, dir: string, isRm: boolean) => {
        if (dir === '/') {
          return state.dirObject
        }

        const temp = dirObj.childrenDirs.find((v) => v.dir === dir)
        if (!temp) {
          return dirObj
        }

        if (isRm) {
          const rmIndex = dirObj.childrenDirs.findIndex((v: any) => v.dir === dir)
          if (rmIndex !== -1) {
            dirObj.childrenDirs.splice(rmIndex, 1)
          }
        }

        return temp
      }

      const dirList = dirPath.split('/')

      let tempDirObj = state.dirObject
      dirList.forEach((d, i) => {
        tempDirObj = rmDir(tempDirObj, d, i === dirList.length - 1)
      })

      dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 增加图片
    DIR_IMAGE_LIST_ADD_IMAGE({ state, dispatch }, item: UploadedImageModel) {
      const addImg = (
        dirObj: DirObject,
        dir: string,
        dirPath: string,
        Img: UploadedImageModel,
        isAdd: boolean = false
      ) => {
        if (!dirObj) {
          return state.dirObject
        }

        let temp = dirObj.childrenDirs?.find((x: DirObject) => x.dir === dir)
        if (!temp) {
          temp = {
            type: 'dir',
            dir,
            dirPath,
            childrenDirs: [],
            imageList: []
          }

          dirObj.childrenDirs.push(temp)
        }

        if (isAdd && !temp.imageList.some((v) => v.name === Img.name)) {
          temp.imageList.push(Img)
        }

        return temp
      }

      let tempDirObj: DirObject = state.dirObject

      if (item.dir === '/') {
        if (!tempDirObj.imageList.some((v) => v.name === item.name)) {
          tempDirObj.imageList.push(item)
        }
      } else {
        const dirList: string[] = item.dir.split('/')
        let dirPath = ''
        dirList.forEach((dir, i) => {
          dirPath += `${i > 0 ? '/' : ''}${dir}`
          tempDirObj = addImg(tempDirObj, dir, dirPath, item, i === dirList.length - 1)
        })
      }

      dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 删除图片（即删除指定目录里的指定图片）
    DIR_IMAGE_LIST_REMOVE({ state, dispatch }, item: any) {
      // 删除
      const rm = (list: UploadedImageModel[], uuid: string) => {
        if (list.length) {
          const rmIndex = list.findIndex((v: any) => v.uuid === uuid)
          if (rmIndex !== -1) {
            list.splice(rmIndex, 1)
          }
        }
      }

      // 删除图片
      const rmImg = (dirObj: DirObject, dir: string, img: UploadedImageModel, isRm: boolean) => {
        if (!dirObj) {
          return state.dirObject
        }

        const temp = dirObj.childrenDirs.find((x: DirObject) => x.dir === dir)
        if (!temp) {
          return state.dirObject
        }

        if (temp.dir === dir && isRm) {
          rm(temp.imageList, img.uuid)
        }

        return temp
      }

      const { dir, uuid } = item

      if (dir === '/') {
        rm(state.dirObject.imageList, uuid)
        dispatch('DIR_IMAGE_LIST_PERSIST')
        return
      }

      const dirList: string[] = dir.split('/')
      let tempDirObj: DirObject = state.dirObject

      dirList.forEach((d, i) => {
        tempDirObj = rmImg(tempDirObj, d, item, i === dirList.length - 1)
        if (!tempDirObj.imageList.length && !tempDirObj.childrenDirs.length) {
          const dirPathList = getUpLevelDirList(tempDirObj.dirPath)

          // 循环遍历判断上一级目录的内容是否为空，为空则删除，依次往上查找，直到根目录
          dirPathList.forEach((dp) => {
            const dpc = getDirContent(dp, state.dirObject)
            if (dpc && !dpc.imageList.length && !dpc.childrenDirs.length) {
              const { dirPath } = getUpOneLevelDir(dp)

              const viewDir: string = dirPath
              const selectedDir: string = dirPath
              let selectedDirList: string[] = selectedDir.split('/')
              if (dirPath === '/') {
                selectedDirList = []

                // 删除 config 配置文件里 dirList 中的目录项
                dispatch('USER_CONFIG_INFO_REMOVE_DIR', dp)
              }

              dispatch('SET_USER_CONFIG_INFO', {
                viewDir,
                selectedDir,
                selectedDirList
              })
              dispatch('DIR_IMAGE_LIST_REMOVE_DIR', dp)
            }
          })
        }
      })
    },

    // 图床管理 - 初始化指定目录（即删除指定目录的子目录列表和图片列表）
    DIR_IMAGE_LIST_INIT_DIR({ state, dispatch }, dirPath: string) {
      let tempDirObj = state.dirObject

      if (dirPath === '/') {
        tempDirObj.imageList = []
        tempDirObj.childrenDirs = []
        dispatch('DIR_IMAGE_LIST_PERSIST')
        return
      }

      const initDirObject = (dirObj: DirObject, dir: string, isInit: boolean) => {
        if (!dirObj) {
          return state.dirObject
        }

        const temp = dirObj.childrenDirs?.find((x: DirObject) => x.dir === dir)
        if (!temp) {
          return state.dirObject
        }

        if (isInit) {
          temp.imageList = []
          temp.childrenDirs = []
        }

        return temp
      }

      const dirList = dirPath.split('/')

      dirList.forEach((d, i) => {
        tempDirObj = initDirObject(tempDirObj, d, i === dirList.length - 1)
      })

      dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 持久化存储
    DIR_IMAGE_LIST_PERSIST({ state }) {
      setLocal(LS_MANAGEMENT, state.dirObject)
    },

    // 图床管理 - 退出登录
    DIR_IMAGE_LOGOUT({ state, dispatch }) {
      state.dirObject = createDirObject('/', '/')
      dispatch('DIR_IMAGE_LIST_PERSIST')
    }
  },

  getters: {
    getDirObject: (state: any) => state.dirObject
  }
}

export default dirImageListModule
