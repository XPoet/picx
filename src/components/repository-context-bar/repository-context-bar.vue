<script setup lang="ts">
import type { RepositoryIdentity } from '@/common/model/github-connection'
import { computed } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'

const props = withDefaults(defineProps<{
  repository: RepositoryIdentity | null
  uploadPath: string
  disabled?: boolean
}>(), { disabled: false })
const emit = defineEmits<{
  configure: []
}>()
const repositoryURL = computed(() => props.repository
  ? `https://github.com/${encodeURIComponent(props.repository.owner)}/${encodeURIComponent(props.repository.repo)}`
  : undefined)
</script>

<template>
  <section class="repository-context">
    <div class="repository-context-row">
      <div v-if="repository" class="repository-identity">
        <a :href="repositoryURL" target="_blank" rel="noopener noreferrer" class="repository-name">
          <PicxIcon name="folder-git-2" :size="18" /><span>{{ repository.owner }}/{{ repository.repo }}</span>
        </a>
        <span class="repository-branch" :title="repository.branch"><PicxIcon name="git-branch" :size="18" /><span>{{ repository.branch }}</span></span>
        <div class="repository-directory">
          <PicxIcon name="folder" :size="18" />
          {{ uploadPath || '/' }}
        </div>
      </div>
      <span v-else>{{ $t('repository_context.no_repository') }}</span>
      <ElButton v-if="repository" class="change-directory-button" text :disabled="disabled" @click="emit('configure')">
        <PicxIcon name="folder-cog" :size="18" />
        <span>{{ $t('repository_context.configure') }}</span>
      </ElButton>
    </div>
  </section>
</template>

<style scoped lang="stylus">
.repository-context {
  min-width 0
  margin-bottom 24px
  font-size 14px

  .repository-context-row {
    display flex
    flex-wrap wrap
    align-items center
    justify-content space-between
    gap 8px 24px
    min-height 60px
    border-bottom 1px solid var(--picx-color-border)
  }

  .repository-identity {
    display flex
    flex 1
    flex-wrap wrap
    align-items center
    min-width 0
    gap 4px 20px
  }

  .repository-name
  .repository-branch
  .repository-directory {
    display flex
    align-items center
    min-width 0
    gap 6px
  }

  .repository-name {
    min-height 44px
    color var(--picx-color-text)
    overflow-wrap anywhere
  }

  .repository-branch {
    max-width 240px

    > span {
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    }
  }

  .repository-directory {
    flex 1
    max-width 400px
    min-width 160px
  }

  .repository-path {
    position relative
    min-width 0
  }

  .change-directory-button {
    min-height 44px
    color var(--picx-color-primary)

    :deep(> span) {
      gap 6px
    }
  }

  @media (max-width 767px) {
    .repository-identity {
      flex-basis 100%
    }

    .repository-directory {
      flex-basis 100%
      max-width 100%
    }

  }
}
</style>
