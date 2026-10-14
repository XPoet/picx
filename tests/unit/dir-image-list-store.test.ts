import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { beforeEach, describe, expect, it } from 'vitest'
// 通过 Store 门面调用 action：门面加载时会完成 picx-store 初始化，
// 避免测试直接导入 picx-store 触发循环导入求值顺序问题
import { store } from '@/stores'
import { getDirContent } from '@/stores/modules/dir-image-list/utils'

const mkImg = (name: string, dir: string): UploadedImageModel => ({
  type: 'image',
  uuid: `uuid-${name}`,
  sha: `sha-${name}`,
  dir,
  path: dir === '/' ? name : `${dir}/${name}`,
  name,
  size: 1,
  deleting: false,
  checked: false,
})

describe('图床管理目录操作（picx-store）', () => {
  beforeEach(() => {
    localStorage.clear()
    store.dispatch('DIR_IMAGE_LOGOUT')
    store.dispatch('USER_CONFIG_INFO_RESET')
  })

  // 初始目录树：
  // / ─── test ─── sub ─── nested.png
  //      │     └─ a.png / b.jpg
  //      └── demo ─── c.png
  const seedTree = () => {
    store.dispatch('DIR_IMAGE_LIST_ADD_DIR', 'test')
    store.dispatch('DIR_IMAGE_LIST_ADD_DIR', 'test/sub')
    store.dispatch('DIR_IMAGE_LIST_ADD_DIR', 'demo')

    const imgA = mkImg('a.png', 'test')
    const imgNested = mkImg('nested.png', 'test/sub')
    const imgC = mkImg('c.png', 'demo')

    store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', imgA)
    store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', mkImg('b.jpg', 'test'))
    store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', imgNested)
    store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', imgC)

    return { imgA, imgNested, imgC }
  }

  it('重命名目录后同步子孙目录与图片路径', () => {
    const { imgA, imgNested } = seedTree()

    store.dispatch('DIR_IMAGE_LIST_RENAME_DIR', { oldDirPath: 'test', newDirName: 'project' })

    const rootObj = store.getters.getDirObject
    expect(rootObj.childrenDirs.map(item => item.dir)).toEqual(['project', 'demo'])
    expect(rootObj.childrenDirs[0].dirPath).toBe('project')

    const project = getDirContent('project', rootObj) as DirObject
    expect(project.imageList.map(item => item.name)).toEqual(['a.png', 'b.jpg'])
    expect(imgA.dir).toBe('project')
    expect(imgA.path).toBe('project/a.png')

    const sub = getDirContent('project/sub', rootObj) as DirObject
    expect(sub).not.toBeNull()
    expect(imgNested.dir).toBe('project/sub')
    expect(imgNested.path).toBe('project/sub/nested.png')

    // dirList 同步替换顶级目录名
    const dirListValues = store.getters.getUserConfigInfo.dirList.map(item => item.value)
    expect(dirListValues).toContain('project')
    expect(dirListValues).not.toContain('test')
  })

  it('重命名目录后同步正在浏览的目录', () => {
    seedTree()
    store.dispatch('SET_USER_CONFIG_INFO', { viewDir: 'test/sub', selectedDir: 'test' })

    store.dispatch('DIR_IMAGE_LIST_RENAME_DIR', { oldDirPath: 'test', newDirName: 'project' })

    const { viewDir, selectedDir } = store.getters.getUserConfigInfo
    expect(viewDir).toBe('project/sub')
    expect(selectedDir).toBe('project')
  })

  it('移动图片到其他目录', () => {
    const { imgA, imgC } = seedTree()

    store.dispatch('DIR_IMAGE_LIST_MOVE_IMAGE', { img: imgA, newDir: 'demo' })

    const rootObj = store.getters.getDirObject
    const demo = getDirContent('demo', rootObj) as DirObject
    const test = getDirContent('test', rootObj) as DirObject

    expect(demo.imageList.map(item => item.uuid)).toEqual([imgC.uuid, imgA.uuid])
    expect(imgA.dir).toBe('demo')
    expect(imgA.path).toBe('demo/a.png')
    expect(test.imageList.map(item => item.name)).toEqual(['b.jpg'])
  })

  it('移动图片到根目录', () => {
    const { imgA } = seedTree()

    store.dispatch('DIR_IMAGE_LIST_MOVE_IMAGE', { img: imgA, newDir: '/' })

    const rootObj = store.getters.getDirObject
    expect(imgA.dir).toBe('/')
    expect(imgA.path).toBe('a.png')
    expect(rootObj.imageList.map(item => item.name)).toEqual(['a.png'])
  })

  it('原目录移空后自动删除该目录并回退视图目录', () => {
    const { imgC } = seedTree()
    store.dispatch('SET_USER_CONFIG_INFO', { viewDir: 'demo', selectedDir: 'demo' })

    store.dispatch('DIR_IMAGE_LIST_MOVE_IMAGE', { img: imgC, newDir: 'test' })

    const rootObj = store.getters.getDirObject
    expect(rootObj.childrenDirs.map(item => item.dir)).toEqual(['test'])

    const { viewDir } = store.getters.getUserConfigInfo
    expect(viewDir).toBe('/')
  })

  it('删除目录后清理子孙内容与用户配置', () => {
    seedTree()
    store.dispatch('SET_USER_CONFIG_INFO', { viewDir: 'demo', selectedDir: 'demo' })

    store.dispatch('DIR_IMAGE_LIST_REMOVE_DIR_TREE', 'test')

    const rootObj = store.getters.getDirObject
    expect(rootObj.childrenDirs.map(item => item.dir)).toEqual(['demo'])
    expect(getDirContent('test/sub', rootObj)).toBeNull()

    const dirListValues = store.getters.getUserConfigInfo.dirList.map(item => item.value)
    expect(dirListValues).not.toContain('test')

    // 正在浏览的目录不受影响时保持不变
    expect(store.getters.getUserConfigInfo.viewDir).toBe('demo')
  })

  it('删除正在浏览的目录后回退到上一级', () => {
    seedTree()
    store.dispatch('SET_USER_CONFIG_INFO', { viewDir: 'test/sub', selectedDir: 'test/sub' })

    store.dispatch('DIR_IMAGE_LIST_REMOVE_DIR_TREE', 'test')

    const { viewDir, selectedDir } = store.getters.getUserConfigInfo
    expect(viewDir).toBe('/')
    expect(selectedDir).toBe('/')
  })
})
