import { DirObject } from '@/stores/modules/dir-image-list/types'

/**
 * 构造一个新的目录对象
 * @param dir
 * @param dirPath
 */
export const createDirObject = (dir: string, dirPath: string): DirObject => {
  return {
    type: 'dir',
    dir,
    dirPath,
    childrenDirs: [],
    imageList: []
  }
}

/**
 * 获取上一级目录
 * @param dirPath
 */
export const getUpOneLevelDir = (dirPath: string) => {
  if (dirPath === '/') {
    return {
      currentDir: '/',
      dirPath: '/'
    }
  }

  const dirList = dirPath.split('/')

  if (dirList.length === 1) {
    return {
      currentDir: '/',
      dirPath: '/'
    }
  }

  if (dirList.length > 1) {
    dirList.length -= 1
    return {
      currentDir: dirList[dirList.length - 1],
      dirPath: dirList.join('/')
    }
  }

  return {
    currentDir: '/',
    dirPath: '/'
  }
}

/**
 * 获取上级目录列表
 * @param dirPath
 */
export const getUpLevelDirList = (dirPath: string) => {
  if (dirPath === '/') {
    return []
  }

  const dirList = dirPath.split('/')

  const tempL: string[] = []
  let tempP = ''

  dirList.forEach((d, i) => {
    tempP += `${i > 0 ? '/' : ''}${d}`
    tempL.unshift(tempP)
  })

  return tempL
}
