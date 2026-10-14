<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { ImageLinkRuleModel } from '@/common/model'
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import { store } from '@/stores'
import { getUuid } from '@/utils/common-utils'

const instance = getCurrentInstance()

const userSettings = computed(() => store.getters.getUserSettings).value
const linkRuleTableData = computed(() => {
  const tmpArr = []

  for (const key in userSettings.imageLinkType.presetList) {
    tmpArr.push(userSettings.imageLinkType.presetList[key])
  }
  return tmpArr
})

const formRef = ref<FormInstance>()

const imageLinkRuleForm: ImageLinkRuleModel = reactive({
  id: '',
  name: '',
  rule: '',
  editable: true,
})

const isImageLinkRule = (value: unknown): value is ImageLinkRuleModel => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ImageLinkRuleModel>
  return (
    typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.rule === 'string'
  )
}

const editImageLinkRule = (event: FocusEvent, ruleObj: unknown) => {
  if (!(event.currentTarget instanceof HTMLElement) || !isImageLinkRule(ruleObj)) {
    return
  }

  const tmpRuleObj: ImageLinkRuleModel = JSON.parse(JSON.stringify(ruleObj))
  const newRule = event.currentTarget.textContent ?? ''
  tmpRuleObj.rule = newRule
  store.dispatch('UPDATE_IMAGE_LINK_TYPE_RULE', { rule: tmpRuleObj })
}

const removeImageLinkRule = (obj: unknown) => {
  if (!isImageLinkRule(obj)) {
    return
  }

  ElMessageBox.confirm(
    `${instance?.proxy?.$t('settings_page.link_format.delete_tips')}：${obj.name}`,
    instance?.proxy?.$t('tip'),
    {
      type: 'warning',
    },
  )
    .then(() => {
      store.dispatch('DEL_IMAGE_LINK_TYPE_RULE', obj)
    })
    .catch(() => undefined)
}

const addImageLinkRule = (formEl: FormInstance | undefined) => {
  if (!formEl)
    return
  formEl.validate((valid) => {
    if (valid) {
      imageLinkRuleForm.id = getUuid()
      store.dispatch('ADD_IMAGE_LINK_TYPE_RULE', {
        rule: JSON.parse(JSON.stringify(imageLinkRuleForm)),
      })
    }
  })
}
</script>

<template>
  <el-card class="settings-item-card">
    <template #header>
      <div class="card-header">
        <span>{{ $t('settings_page.link_rule.card_title') }}</span>
      </div>
    </template>
    <el-table :data="linkRuleTableData" style="width: 100%">
      <el-table-column
        prop="name"
        :label="$t('settings_page.link_rule.card_table_col_title_1')"
        width="120"
      />
      <el-table-column :label="$t('settings_page.link_rule.card_table_col_title_2')">
        <template #default="scope">
          <div :contenteditable="true" @focusout="editImageLinkRule($event, scope.row)">
            {{ scope.row.rule }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('settings_page.link_rule.card_table_col_title_3')"
        width="80"
        align="center"
      >
        <template #default="scope">
          <el-button
            link
            size="small"
            :disabled="!scope.row.editable"
            @click="removeImageLinkRule(scope.row)"
          >
            <IEpDelete />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-divider />
    <div style="margin-top: 20px">
      <el-form
        ref="formRef"
        label-position="left"
        :model="imageLinkRuleForm"
        label-width="120px"
        size="default"
      >
        <el-form-item
          :label="$t('settings_page.link_rule.input_name_1')"
          prop="name"
          :rules="[{ required: true, message: $t('settings_page.link_rule.input_name_1_rule') }]"
        >
          <el-input v-model="imageLinkRuleForm.name" type="text" />
        </el-form-item>
        <el-form-item
          :label="$t('settings_page.link_rule.input_name_2')"
          prop="rule"
          :rules="[{ required: true, message: $t('settings_page.link_rule.input_name_2_rule') }]"
        >
          <el-input v-model="imageLinkRuleForm.rule" type="text" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!imageLinkRuleForm.name || !imageLinkRuleForm.rule"
            @click="addImageLinkRule(formRef)"
          >
            {{ $t('settings_page.link_rule.btn_name_1') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<style scoped lang="stylus">
@import "./image-link-rule-config.styl"
</style>
