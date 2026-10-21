import type { UploadedImageModel } from '@/common/model'
import { describe, expect, it } from 'vitest'
import { ImageSortEnum } from '@/common/model/image'
import { createDirObject } from '@/stores/modules/dir-image-list/utils'
import { filterManagementContent, sortDirList, sortImageList } from '@/utils/management-utils'

const image = (name: string, uploadTime?: number): UploadedImageModel => ({ type: 'image', uuid: name, sha: name, dir: '/', path: name, name, size: 10, checked: false, deleting: false, uploadTime })

describe('管理页当前目录过滤与排序', () => {
  it('忽略大小写，仅过滤传入的直属内容，不递归子目录', () => {
    const album = createDirObject('Album2', 'Album2')
    album.imageList = [image('hidden.png')]
    const result = filterManagementContent([album], [image('COAST.png')], '  coast ')
    expect(result.images.map(item => item.name)).toEqual(['COAST.png'])
    expect(result.directories).toEqual([])
    expect(filterManagementContent([album], [], 'hidden').images).toEqual([])
    expect(filterManagementContent([album], [], 'album').directories).toEqual([album])
  })

  it('名称按自然升降序排列，所有模式保持源数组顺序', () => {
    const items = [image('img10.png'), image('img2.png'), image('img1.png')]
    const dirs = ['folder10', 'folder2', 'folder1'].map(name => createDirObject(name, name))
    expect(sortImageList(items, ImageSortEnum.nameAsc).map(item => item.name)).toEqual(['img1.png', 'img2.png', 'img10.png'])
    expect(sortImageList(items, ImageSortEnum.nameDesc).map(item => item.name)).toEqual(['img10.png', 'img2.png', 'img1.png'])
    expect(sortDirList(dirs, ImageSortEnum.nameAsc).map(item => item.dir)).toEqual(['folder1', 'folder2', 'folder10'])
    expect(sortDirList(dirs, ImageSortEnum.nameDesc).map(item => item.dir)).toEqual(['folder10', 'folder2', 'folder1'])
    expect(items[0].name).toBe('img10.png')
    expect(dirs[0].dir).toBe('folder10')
    expect(sortImageList(items, ImageSortEnum.default)).toEqual(items)
    expect(sortImageList(items, ImageSortEnum.default)).not.toBe(items)
  })

  it('缺失或无效时间排在已知时间之后，未知顺序稳定', () => {
    const items = [image('unknown'), image('old', 1), image('new', 3), image('invalid', Number.NaN)]
    expect(sortImageList(items, ImageSortEnum.timeDesc).map(item => item.name)).toEqual(['new', 'old', 'unknown', 'invalid'])
  })
})
