import type { UploadedImageModel } from '@/common/model'
import { describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import { useManagementSelection } from '@/composables/use-management-selection'

const image = (path: string, sha = path, uuid = path): UploadedImageModel => ({ type: 'image', path, sha, uuid, name: path, dir: '/', checked: false, deleting: false, size: 1 })
function setup() {
  const visible = ref([image('a.png'), image('b.png')])
  const path = ref('/')
  const query = ref('')
  const scope = effectScope()
  const selection = scope.run(() => useManagementSelection(visible, path, query))
  if (!selection)
    throw new Error('Missing selection scope')
  return { visible, path, query, selection, scope }
}

describe('管理页可见范围选择', () => {
  it('半选、全选与清空只作用于传入媒体，不能选择隐藏项', () => {
    const { visible, selection, scope } = setup()
    selection.select(visible.value[0], true)
    expect(selection.indeterminate.value).toBe(true)
    expect(selection.allSelected.value).toBe(false)
    selection.select(image('hidden.png'), true)
    expect(selection.selectedImages.value.map(item => item.path)).toEqual(['a.png'])
    selection.selectAll(true)
    expect(selection.allSelected.value).toBe(true)
    expect(selection.indeterminate.value).toBe(false)
    expect(selection.selectedImages.value.map(item => item.path)).toEqual(['a.png', 'b.png'])
    expect(visible.value.every(item => !item.checked)).toBe(true)
    selection.clear()
    expect(selection.selectedImages.value).toEqual([])
    scope.stop()
  })

  it('排序保留集合，刷新不依赖 uuid，但路径或 sha 变化会取消', () => {
    const { visible, selection, scope } = setup()
    selection.selectAll(true)
    visible.value = [...visible.value].reverse()
    expect(selection.selectedImages.value.map(item => item.path)).toEqual(['b.png', 'a.png'])
    visible.value = [image('a.png', 'a.png', 'new-uuid'), image('b.png', 'replaced-sha')]
    expect(selection.selectedImages.value.map(item => item.path)).toEqual(['a.png'])
    visible.value = [image('renamed.png', 'a.png')]
    expect(selection.selectedImages.value).toEqual([])
    scope.stop()
  })

  it('切换搜索词或目录同步清空；过滤结果变化会去除隐藏项', () => {
    const { visible, path, query, selection, scope } = setup()
    selection.selectAll(true)
    query.value = 'a'
    expect(selection.selectedImages.value).toEqual([])
    selection.selectAll(true)
    visible.value = [visible.value[0]]
    expect(selection.selectedImages.value.map(item => item.path)).toEqual(['a.png'])
    path.value = 'albums'
    expect(selection.selectedImages.value).toEqual([])
    scope.stop()
  })
})
