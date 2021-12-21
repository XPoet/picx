function getContent(targetContent: any, dirList: string[], n: number): any {
  if (targetContent) {
    if (dirList.length === n) {
      return targetContent
    }
    return getContent(
      targetContent.childrenDirs.find((v: any) => v.dir === dirList[n]),
      dirList,
      // eslint-disable-next-line no-param-reassign,no-plusplus
      ++n
    )
  }
  return null
}

/**
 * 获取当前目录下所有内容（子目录和图片）
 * @param dirPath
 * @param dirImageList
 */
export const getDirContent = (dirPath: string, dirImageList: any[]) => {
  if (dirPath === '/') {
    return dirImageList
  }

  const dirList: string[] = dirPath.split('/')
  const targetContent_l1 = dirImageList.find((v) => v.dir === dirList[0])
  return getContent(targetContent_l1, dirList, 1)
}

/**
 * 获取当前目录下所有内容（子目录和图片）
 * @param dirPath
 * @param content
 * @param type
 */
export const filterDirContent = (dirPath: string, content: any, type: string): any => {
  if (dirPath === '/') {
    return content.filter((x: any) => x.type === type)
  }

  if (type === 'dir') {
    return content.childrenDirs.filter((x: any) => x.type === 'dir')
  }

  if (type === 'image') {
    return content.imageList
  }

  return []
}
