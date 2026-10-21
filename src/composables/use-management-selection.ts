import type { Ref } from 'vue'
import type { UploadedImageModel } from '@/common/model'
import { computed, shallowRef, watch } from 'vue'

export const managementMediaIdentity = (image: Pick<UploadedImageModel, 'path' | 'sha'>) => `${image.path}\0${image.sha}`

export function useManagementSelection(images: Ref<readonly UploadedImageModel[]>, directory: Ref<string>, query: Ref<string>) {
  const selectedKeys = shallowRef<Set<string>>(new Set())
  const selectedImages = computed(() => images.value.filter(image => selectedKeys.value.has(managementMediaIdentity(image))))
  const allSelected = computed(() => images.value.length > 0 && selectedImages.value.length === images.value.length)
  const indeterminate = computed(() => selectedImages.value.length > 0 && !allSelected.value)
  function clear() {
    selectedKeys.value = new Set()
  }
  function isSelected(image: UploadedImageModel) {
    return selectedKeys.value.has(managementMediaIdentity(image))
  }
  function select(image: UploadedImageModel, checked: boolean) {
    const key = managementMediaIdentity(image)
    if (!images.value.some(item => managementMediaIdentity(item) === key))
      return
    const next = new Set(selectedKeys.value)
    if (checked)
      next.add(key)
    else next.delete(key)
    selectedKeys.value = next
  }
  function selectAll(checked: boolean) {
    selectedKeys.value = new Set(checked ? images.value.map(managementMediaIdentity) : [])
  }
  watch([directory, query], clear, { flush: 'sync' })
  watch(() => images.value.map(managementMediaIdentity), (keys) => {
    const valid = new Set(keys)
    selectedKeys.value = new Set([...selectedKeys.value].filter(key => valid.has(key)))
  }, { flush: 'sync' })
  return { selectedImages, allSelected, indeterminate, isSelected, select, selectAll, clear }
}
