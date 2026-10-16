<script setup lang="ts">
import type { ElementPlusSizeEnum } from '@/common/model'
import type { DirectoryQueryState } from '@/common/model/repository-directory'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { NEW_DIR_COUNT_MAX } from '@/common/constant'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { directoryQueryKey } from '@/utils/directory-utils'

const props = withDefaults(defineProps<{
  controlled?: boolean
  modelValue?: readonly string[]
  loads?: Readonly<Record<string, DirectoryQueryState>>
  disabled?: boolean
  elKey?: string
  elSize?: ElementPlusSizeEnum
  elWidth?: string
  elClearable?: boolean
}>(), { controlled: false, modelValue: () => [], loads: () => ({}), disabled: false, elKey: '', elWidth: '100%', elClearable: false })

const emit = defineEmits<{
  'update:modelValue': [segments: string[]]
  'requestChildren': [parentSegments: string[]]
  'retry': [parentSegments: string[]]
}>()

const LegacyRepoDirCascader = defineAsyncComponent(() => import('./legacy-repo-dir-cascader.vue'))

const expanded = ref<string[]>([])
const parents = computed(() => [[], ...expanded.value.map((_segment, index) => expanded.value.slice(0, index + 1))])
const columns = computed(() => parents.value.map(parent => ({
  parent,
  key: directoryQueryKey(parent),
  state: props.loads[directoryQueryKey(parent)] ?? { phase: 'idle' as const },
})))
const currentState = computed(() => props.loads[directoryQueryKey(expanded.value)])
const selected = (segments: readonly string[]) => segments.join('/') === props.modelValue.join('/')
const itemsFor = (state: DirectoryQueryState) => 'items' in state ? state.items ?? [] : []

function expand(segments: readonly string[]) {
  if (props.disabled || segments.length >= NEW_DIR_COUNT_MAX)
    return
  expanded.value = [...segments]
  emit('requestChildren', [...segments])
}
function select(segments: readonly string[]) {
  if (!props.disabled)
    emit('update:modelValue', [...segments])
}
onMounted(() => {
  if (!props.controlled)
    return
  expanded.value = props.modelValue.slice(0, NEW_DIR_COUNT_MAX - 1).slice(0, Math.max(0, props.modelValue.length - 1))
  for (const parent of parents.value) emit('requestChildren', [...parent])
})
</script>

<template>
  <LegacyRepoDirCascader v-if="!controlled" :el-key="elKey" :el-size="elSize" :el-width="elWidth" :el-clearable="elClearable" />
  <div v-else class="controlled-directory-selector" :aria-label="$t('directory_selector.label')">
    <div class="directory-selector-toolbar">
      <p class="selected-directory">
        {{ modelValue.length ? `/${modelValue.join('/')}` : $t('directory_selector.no_selection') }}
      </p>
      <button type="button" :disabled="disabled || currentState?.phase === 'loading'" @click="emit('retry', [...expanded])">
        <PicxIcon name="refresh-cw" :size="16" />{{ $t('directory_selector.refresh') }}
      </button>
    </div>
    <nav class="directory-breadcrumbs" :aria-label="$t('directory_selector.breadcrumbs')">
      <button type="button" :disabled="disabled" @click="expand([])">
        {{ $t('config_page.root_dir') }}
      </button>
      <button v-for="(segment, index) in expanded" :key="expanded.slice(0, index + 1).join('/')" type="button" :disabled="disabled" @click="expand(expanded.slice(0, index + 1))">
        / {{ segment }}
      </button>
    </nav>
    <div class="directory-columns">
      <section v-for="(column, index) in columns" :key="column.key" class="directory-column" :aria-label="$t('directory_selector.level', { level: index + 1 })">
        <p class="directory-level-title">
          {{ $t('directory_selector.level', { level: index + 1 }) }}
        </p>
        <p v-if="column.state.phase === 'idle' || column.state.phase === 'loading'" class="directory-query-message" role="status">
          {{ $t('directory_selector.loading') }}
        </p>
        <div v-if="column.state.phase === 'failed'" class="directory-query-error" role="alert">
          <p>{{ $t(`request_error.${column.state.error.kind}`) }}</p>
          <button type="button" :disabled="disabled" @click="emit('retry', [...column.parent])">
            {{ $t('directory_selector.retry') }}
          </button>
        </div>
        <p v-if="column.state.phase === 'loaded' && !column.state.items.length" class="directory-query-message">
          {{ $t('directory_selector.empty') }}
        </p>
        <ul>
          <li v-for="item in itemsFor(column.state)" :key="item.segments.join('/')" :class="{ selected: selected(item.segments) }">
            <button type="button" class="directory-select" :disabled="disabled" :aria-pressed="selected(item.segments)" @click="select(item.segments)" @keydown.right.prevent="expand(item.segments)">
              <PicxIcon name="folder-open" :size="16" /><span>{{ item.name }}</span>
            </button>
            <button v-if="!item.leaf && item.segments.length < NEW_DIR_COUNT_MAX" type="button" class="directory-expand" :disabled="disabled" :aria-label="$t('directory_selector.expand', { name: item.name })" :aria-expanded="expanded.slice(0, item.segments.length).join('/') === item.segments.join('/')" @click="expand(item.segments)">
              <PicxIcon name="chevron-down" :size="16" />
            </button>
          </li>
        </ul>
      </section>
    </div>
    <p class="directory-selector-hint">
      {{ $t('directory_selector.hint', { max: NEW_DIR_COUNT_MAX }) }}
    </p>
  </div>
</template>

<style scoped lang="stylus">
.controlled-directory-selector {
  min-width 0
  font-size 14px

  button {
    min-height 44px
    color var(--picx-color-primary)
    font-size inherit
    background transparent
    border 0
    cursor pointer

    &:disabled {
      cursor not-allowed
    }
  }

  .directory-selector-toolbar {
    display flex
    align-items center
    justify-content space-between
    gap 12px

    .selected-directory {
      min-width 0
      overflow-wrap anywhere
    }

    button {
      display inline-flex
      flex-shrink 0
      align-items center
      gap 6px
    }
  }

  .directory-breadcrumbs {
    display flex
    flex-wrap wrap
    gap 4px

    button {
      min-width 44px
      padding 4px 8px
      overflow-wrap anywhere
    }
  }

  .directory-columns {
    display flex
    max-width 100%
    overflow-x auto
    border 1px solid var(--picx-color-border)
    border-radius 10px
  }

  .directory-column {
    flex 1 0 180px
    box-sizing border-box
    min-width 0
    max-height 240px
    padding 8px
    overflow-y auto

    + .directory-column {
      border-left 1px solid var(--picx-color-border)
    }
  }

  .directory-level-title {
    margin 0 8px 4px
    color var(--picx-color-text-muted)
    font-size 14px
  }

  ul {
    margin 0
    padding 0
    list-style none
  }

  li {
    display flex
    align-items center
    border-radius 8px

    &.selected {
      background var(--picx-color-primary-soft)
    }
  }

  .directory-select {
    display flex
    flex 1
    align-items center
    gap 6px
    min-width 0
    padding 4px 8px
    color var(--picx-color-text)
    text-align left

    span {
      overflow-wrap anywhere
    }
  }

  .directory-expand {
    flex-shrink 0
    width 44px

    .picx-icon {
      transform rotate(-90deg)
    }
  }

  .directory-query-message
  .directory-selector-hint {
    margin 8px 0
    color var(--picx-color-text-muted)
    line-height 1.6
  }

  .directory-query-error {
    color var(--picx-color-danger)
    line-height 1.6

    p {
      margin 8px
    }
  }

  @media (max-width 767px) {
    .directory-column {
      display none
      flex-basis 100%
      border-left 0

      &:last-child {
        display block
      }
    }
  }
}
</style>
