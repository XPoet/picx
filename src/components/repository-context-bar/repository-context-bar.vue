<script setup lang="ts">
import type { ConnectionState, RepositoryIdentity } from '@/common/model/github-connection'
import { computed } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'

const props = withDefaults(defineProps<{
  repository: RepositoryIdentity | null
  uploadPath: string
  connection: ConnectionState
  disabled?: boolean
}>(), { disabled: false })
const emit = defineEmits<{
  configure: []
  reconnect: []
}>()
const verified = computed(() => props.connection.phase === 'connected'
  && props.repository?.owner === props.connection.repository.owner
  && props.repository?.repo === props.connection.repository.repo
  && props.repository?.branch === props.connection.repository.branch)
const status = computed(() => {
  if (verified.value)
    return 'connected'
  if (props.connection.phase === 'validating' || props.connection.phase === 'initializing')
    return 'connecting'
  if (props.connection.phase === 'failed') {
    const kind = props.connection.error.kind
    if (kind === 'offline' || kind === 'unauthenticated' || kind === 'forbidden')
      return kind
    return 'failed'
  }
  return props.repository ? 'unverified' : 'disconnected'
})
const visibility = computed(() => verified.value && props.connection.phase === 'connected' ? props.connection.visibility : 'unknown')
const repositoryURL = computed(() => props.repository
  ? `https://github.com/${encodeURIComponent(props.repository.owner)}/${encodeURIComponent(props.repository.repo)}`
  : undefined)
</script>

<template>
  <section class="repository-context" :aria-label="$t('repository_context.label')">
    <div class="repository-context-row">
      <div v-if="repository" class="repository-identity">
        <a :href="repositoryURL" target="_blank" rel="noopener noreferrer" class="repository-name">
          <PicxIcon name="folder-git-2" :size="18" /><span>{{ repository.owner }}/{{ repository.repo }}</span>
        </a>
        <span class="repository-branch" :title="repository.branch"><PicxIcon name="git-branch" :size="18" /><span>{{ repository.branch }}</span></span>
        <div class="repository-directory">
          <PicxIcon name="folder" :size="18" />
          <details class="repository-path">
            <summary :aria-label="$t('repository_context.show_path', { path: uploadPath || '/' })" :title="uploadPath || '/'">
              {{ uploadPath || '/' }}
            </summary>
            <p>{{ uploadPath || '/' }}</p>
          </details>
          <button class="picx-icon-button" type="button" :aria-label="$t('repository_context.configure')" :disabled="disabled" @click="emit('configure')">
            <PicxIcon name="folder-cog" :size="18" />
          </button>
        </div>
      </div>
      <span v-else>{{ $t('repository_context.no_repository') }}</span>
      <div class="repository-connection" :class="{ connected: verified }" role="status">
        <PicxIcon :name="verified ? 'circle-check' : 'info'" :size="18" />
        <span>{{ $t(`repository_context.${status}`) }}</span>
        <button v-if="!verified && status !== 'connecting'" type="button" class="reconnect-button" @click="emit('reconnect')">
          {{ $t('repository_context.reconnect') }}
        </button>
      </div>
    </div>
    <p class="repository-visibility">
      <PicxIcon name="info" :size="16" />{{ $t(`repository_context.visibility_${visibility}`) }}
    </p>
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
  .repository-directory
  .repository-connection {
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

    summary {
      box-sizing border-box
      min-height 44px
      padding 12px 2px
      overflow hidden
      list-style none
      text-overflow ellipsis
      white-space nowrap
      cursor pointer

      &::-webkit-details-marker {
        display none
      }
    }

    p {
      position absolute
      z-index 1
      box-sizing border-box
      width max-content
      max-width unquote('min(400px, 80vw)')
      margin 0
      padding 12px
      overflow-wrap anywhere
      background var(--picx-color-surface)
      border 1px solid var(--picx-color-border)
      border-radius 10px
      box-shadow 0 8px 24px var(--picx-color-shadow)
    }
  }

  .repository-connection {
    flex-wrap wrap
    color var(--picx-color-text-muted)

    &.connected {
      color var(--picx-color-connected)
    }
  }

  .reconnect-button {
    min-height 44px
    padding 0 8px
    color var(--picx-color-primary)
    font-size inherit
    background transparent
    border 0
    cursor pointer
  }

  .repository-visibility {
    display flex
    align-items flex-start
    gap 8px
    margin 12px 0 0
    color var(--picx-color-text-muted)
    line-height 1.6
  }

  @media (max-width 767px) {
    .repository-identity {
      flex-basis 100%
    }

    .repository-directory {
      flex-basis 100%
      max-width 100%
    }

    .repository-connection {
      padding-bottom 8px
    }
  }
}
</style>
