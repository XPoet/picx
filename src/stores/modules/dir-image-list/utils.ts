import type { DirObject } from '@/stores/modules/dir-image-list/types'

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
    imageList: [],
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
      dirPath: '/',
    }
  }

  const dirList = dirPath.split('/')

  if (dirList.length === 1) {
    return {
      currentDir: '/',
      dirPath: '/',
    }
  }

  if (dirList.length > 1) {
    dirList.length -= 1
    return {
      currentDir: dirList[dirList.length - 1],
      dirPath: dirList.join('/'),
    }
  }

  return {
    currentDir: '/',
    dirPath: '/',
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

/**
 * 获取指定目录下的内容。
 *
 * @param dirPath 目标目录路径。
 * @param dirObject 根目录对象。
 * @returns 目标目录对象，不存在时返回 null。
 */
export function getDirContent(dirPath: string, dirObject: DirObject): DirObject | null {
  if (dirPath === '/') {
    return dirObject
  }

  return dirPath.split('/').reduce<DirObject | null>((currentDirectory, directoryName) => {
    if (!currentDirectory) {
      return null
    }

    return (
      currentDirectory.childrenDirs.find(
        childDirectory => childDirectory.dir === directoryName,
      ) ?? null
    )
  }, dirObject)
}
