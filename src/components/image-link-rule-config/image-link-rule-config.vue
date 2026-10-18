<script setup lang="ts">
import type { ImageLinkRuleModel } from '@/common/model'
import { computed, reactive, ref, useId } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import i18n from '@/plugins/vue/i18n'
import { getUuid } from '@/utils/common-utils'
import { validateLinkRule } from '@/utils/link-rule-validation'

const props = defineProps<{ rules: Record<string, ImageLinkRuleModel> }>()
const emit = defineEmits<{
  save: [rule: ImageLinkRuleModel, originalName: string | undefined, done: (success: boolean) => void]
  remove: [rule: ImageLinkRuleModel]
}>()
const id = useId()
const form = reactive({ name: '', rule: '' })
const editing = ref<string>()
const error = ref('')
const list = computed(() => Object.values(props.rules))
const templateExample = 'https://cdn.example.com/{{owner}}/{{repo}}/{{path}}'
const variables = ['{{owner}}', '{{repo}}', '{{branch}}', '{{path}}'].join('、')
function reset() {
  form.name = ''
  form.rule = ''
  editing.value = undefined
  error.value = ''
}
function edit(rule: ImageLinkRuleModel) {
  form.name = rule.name
  form.rule = rule.rule
  editing.value = rule.name
  error.value = ''
  document.getElementById(`${id}-template`)?.focus()
}
function save() {
  const issue = validateLinkRule(form, props.rules, editing.value)
  if (issue) {
    error.value = `link_rules.${issue}`
    return
  }
  const previous = editing.value ? props.rules[editing.value] : undefined
  emit('save', { ...previous, id: previous?.id ?? getUuid(), name: form.name.trim(), rule: form.rule.trim(), editable: previous ? previous.editable : true }, editing.value, (success) => {
    if (success)
      reset()
    else error.value = 'link_rules.save-failed'
  })
}
async function remove(rule: ImageLinkRuleModel) {
  try {
    await ElMessageBox.confirm(i18n.global.t('link_rules.delete_confirm', { name: rule.name }), i18n.global.t('tip'), { type: 'warning', confirmButtonText: i18n.global.t('confirm'), cancelButtonText: i18n.global.t('cancel') })
    emit('remove', rule)
  }
  catch {}
}
</script>

<template>
  <article class="settings-card link-rule-config">
    <div class="link-rule-intro">
      <h2>{{ $t('link_rules.title') }}</h2><p>{{ $t('link_rules.description') }}</p>
    </div>
    <ul class="link-rule-list">
      <li v-for="rule in list" :key="rule.id">
        <strong>{{ rule.name }}</strong><code class="settings-preview">{{ rule.rule }}</code>
        <div class="link-rule-actions">
          <el-button :aria-label="$t('link_rules.edit_named', { name: rule.name })" @click="edit(rule)">
            <PicxIcon name="pencil" :size="18" />{{ $t('link_rules.edit') }}
          </el-button>
          <el-button :disabled="!rule.editable" :aria-label="$t('link_rules.delete_named', { name: rule.name })" @click="remove(rule)">
            <PicxIcon name="trash-2" :size="18" />{{ $t('delete') }}
          </el-button>
        </div>
      </li>
    </ul>
    <form class="link-rule-form" @submit.prevent="save">
      <h3 v-if="editing">
        {{ $t('link_rules.edit_named', { name: editing }) }}
      </h3>
      <label :for="`${id}-name`">{{ $t('link_rules.name') }}</label>
      <el-input :id="`${id}-name`" v-model="form.name" :disabled="editing !== undefined && !rules[editing]?.editable" maxlength="60" :placeholder="$t('link_rules.name_placeholder')" />
      <label :for="`${id}-template`">{{ $t('link_rules.template') }}</label>
      <el-input :id="`${id}-template`" v-model="form.rule" type="textarea" :rows="3" :placeholder="templateExample" />
      <p>{{ $t('link_rules.variables', { variables }) }}</p>
      <p v-if="error" role="alert" class="settings-error">
        {{ $t(error) }}
      </p>
      <div class="link-rule-actions">
        <el-button v-if="editing" @click="reset">
          {{ $t('cancel') }}
        </el-button>
        <el-button type="primary" native-type="submit">
          <PicxIcon :name="editing ? 'check' : 'plus'" :size="18" />{{ $t(editing ? 'link_rules.save' : 'link_rules.add') }}
        </el-button>
      </div>
    </form>
  </article>
</template>

<style scoped lang="stylus">
@import "./image-link-rule-config.styl"
</style>
