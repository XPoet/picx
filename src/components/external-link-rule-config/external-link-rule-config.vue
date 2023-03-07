<template>
  <el-card>
    <el-table :data="userSettings.externalLinkTypeList" style="width: 100%">
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column label="CDN 规则">
        <template #default="scope">
          <div
            :contenteditable="scope.row.editable"
            @focusout="editExternalRule($event.target.innerHTML, scope.row.id)"
          >
            {{ scope.row.rule }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="scope">
          <el-button
            link
            type="danger"
            size="small"
            :disabled="!scope.row.editable"
            @click="removeExternalRule(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-divider />
    <div style="margin-top: 20px">
      <el-form
        ref="formRef"
        label-position="left"
        :model="cdnRuleForm"
        label-width="120px"
        size="default"
      >
        <el-form-item
          label="CDN 类型名称"
          prop="type"
          :rules="[{ required: true, message: 'CDN 类型名称不能为空' }]"
        >
          <el-input v-model="cdnRuleForm.type" type="text" />
        </el-form-item>
        <el-form-item
          label="CDN 加速规则"
          prop="rule"
          :rules="[{ required: true, message: 'CDN 加速规则不能为空' }]"
        >
          <el-input v-model="cdnRuleForm.rule" type="text" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addExternalRule(formRef)">添加 CDN 规则</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { FormInstance } from 'element-plus'
import { store } from '@/store'
import { ExternalLinkRuleModel } from '@/common/model'
import { getUuid } from '@/utils/common-utils'

const userSettings = computed(() => store.getters.getUserSettings).value

const formRef = ref<FormInstance>()

const cdnRuleForm = reactive({
  id: '',
  type: '',
  rule: '',
  editable: true
})

const editExternalRule = (rule: string, id: string) => {
  store.dispatch('MODIFY_CDN_TYPE_RULE', { rule, id })
}

const removeExternalRule = (id: string) => {
  store.dispatch('DEL_CDN_TYPE_RULE', id)
}

const addExternalRule = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  // eslint-disable-next-line consistent-return
  formEl.validate((valid) => {
    if (valid) {
      cdnRuleForm.id = getUuid()
      store.dispatch('ADD_CDN_TYPE_RULE', cdnRuleForm)
    } else {
      return false
    }
  })
}
</script>

<style scoped lang="stylus">
@import "./external-link-rule-config.styl"
</style>
