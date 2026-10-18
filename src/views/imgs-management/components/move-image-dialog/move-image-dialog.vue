<script setup lang="ts">
import type { UploadedImageModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiFailure } from '@/utils/request/types'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import RepoDirCascader from '@/components/repo-dir-cascader/repo-dir-cascader.vue'
import { useRepositoryDirectories } from '@/composables/use-repository-directories'
import i18n from '@/plugins/vue/i18n'
import { relocateManagementMedia } from '@/services/management'
import { managementBusy } from '@/services/management-actions'
import { store } from '@/stores'

const visible = ref(false)
const moving = ref(false)
const image = shallowRef<UploadedImageModel | null>(null)
const repository = shallowRef<RepositoryIdentity | null>(null)
const selected = ref<string[] | null>(null)
const failure = shallowRef<ApiFailure | null>(null)
const { loads, beginSession, endSession, loadChildren } = useRepositoryDirectories(repository)
const destination = computed(() => selected.value === null ? '' : selected.value.join('/') || '/')
watch(() => store.getters.getUploadAreaState.isShowMoveImageDialog, (open) => {
  if (!open)
    return
  image.value = store.getters.getUploadAreaState.moveImageInfo
  const { owner, repo, branch } = store.getters.getUserConfigInfo
  repository.value = { owner, repo, branch }
  selected.value = null
  failure.value = null
  beginSession()
  visible.value = true
  store.commit('SET_UPLOAD_AREA_STATE', { isShowMoveImageDialog: false })
})
function close() {
  if (moving.value)
    return
  visible.value = false
  endSession()
  store.commit('SET_UPLOAD_AREA_STATE', { moveImageInfo: null })
}
async function confirm() {
  if (!image.value || !repository.value || !destination.value || destination.value === image.value.dir || moving.value)
    return
  moving.value = true
  managementBusy.value = true
  failure.value = null
  try {
    const response = await relocateManagementMedia(repository.value, image.value, destination.value)
    if (!response.ok) {
      failure.value = response.error
      return
    }
    ElMessage.success(i18n.global.t('management_page.message8'))
    if (response.data.cacheFailed)
      ElMessage.warning(i18n.global.t('management_page.workspace.cacheFailed'))
    visible.value = false
  }
  finally {
    moving.value = false
    managementBusy.value = false
  }
}
onBeforeUnmount(endSession)
</script>

<template>
  <el-dialog v-model="visible" :title="$t('management_page.workspace.move')" width="min(760px, 92vw)" append-to-body destroy-on-close :show-close="!moving" :close-on-click-modal="!moving" :close-on-press-escape="!moving" @closed="close">
    <p class="move-impact">
      {{ $t('management_page.workspace.moveImpact', { path: image?.path }) }}
    </p>
    <div v-if="failure" class="move-failure" role="alert">
      {{ $t(`request_error.${failure.kind}`) }}
    </div>
    <el-button :disabled="moving || image?.dir === '/'" :aria-pressed="destination === '/'" @click="selected = []">
      {{ $t('config_page.root_dir') }}
    </el-button>
    <RepoDirCascader v-if="visible" controlled :model-value="selected ?? []" :loads="loads" :disabled="moving" @update:model-value="selected = $event" @request-children="loadChildren" @retry="loadChildren($event, true)" />
    <template #footer>
      <el-button :disabled="moving" @click="close">
        {{ $t('cancel') }}
      </el-button>
      <el-button type="primary" :loading="moving" :disabled="!destination || destination === image?.dir" @click="confirm">
        {{ $t('confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="stylus">
.move-impact {
  font-size 14px
  line-height 1.6
  overflow-wrap anywhere
}

.move-failure {
  margin-bottom 16px
  padding 12px
  border-radius 8px
  background var(--picx-color-danger-soft)
  color var(--picx-color-danger)
  font-size 14px
}
</style>
