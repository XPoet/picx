const createDirObject = (dir: string, dirPath: string) => {
  return {
    type: 'dir',
    dir,
    dirList: dirPath.split('/'),
    dirPath,
    childrenDirs: [],
    imageList: []
  }
}

// eslint-disable-next-line import/prefer-default-export
export { createDirObject }
