<template>
  <el-card>
    <el-table :data="userSettings.imageLinkType.presetList" style="width: 100%">
      <el-table-column prop="name" label="类型" width="120" />
      <el-table-column label="CDN 规则">
        <template #default="scope">
          <div
            :contenteditable="scope.row.editable"
            @focusout="editImageLinkRule($event.target.innerHTML, scope.row.id)"
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
            @click="removeImageLinkRule(scope.row)"
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
        :model="imageLinkRuleForm"
        label-width="120px"
        size="default"
      >
        <el-form-item
          label="图片链接类型"
          prop="name"
          :rules="[{ required: true, message: '图片链接类型名称不能为空' }]"
        >
          <el-input v-model="imageLinkRuleForm.name" type="text" />
        </el-form-item>
        <el-form-item
          label="图片链接规则"
          prop="rule"
          :rules="[{ required: true, message: '图片链接规则不能为空' }]"
        >
          <el-input v-model="imageLinkRuleForm.rule" type="text" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!imageLinkRuleForm.name || !imageLinkRuleForm.rule"
            @click="addImageLinkRule(formRef)"
          >
            添加图片链接规则
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { FormInstance } from 'element-plus'
import { store } from '@/store'
import { getUuid } from '@/utils/common-utils'
import { ImageLinkRuleModel } from '@/common/model'

const userSettings = computed(() => store.getters.getUserSettings).value

const formRef = ref<FormInstance>()

const imageLinkRuleForm: ImageLinkRuleModel = reactive({
  id: '',
  name: '',
  rule: '',
  editable: true
})

const editImageLinkRule = (rule: string, id: string) => {
  store.dispatch('UPDATE_IMAGE_LINK_TYPE_RULE', { rule, id })
}

const removeImageLinkRule = (obj: ImageLinkRuleModel) => {
  ElMessageBox.confirm(
    `<span>此操作将永久删除图片链接规则：</span><strong>${obj.name}</strong>`,
    `删除提示`,
    {
      dangerouslyUseHTMLString: true,
      type: 'warning'
    }
  )
    .then(() => {
      store.dispatch('DEL_IMAGE_LINK_TYPE_RULE', obj.id)
    })
    .catch(() => {
      console.log('取消删除')
    })
}

const addImageLinkRule = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  // eslint-disable-next-line consistent-return
  formEl.validate((valid) => {
    if (valid) {
      imageLinkRuleForm.id = getUuid()
      store.dispatch('ADD_IMAGE_LINK_TYPE_RULE', imageLinkRuleForm)
    } else {
      return false
    }
  })
}
</script>

<style scoped lang="stylus">
@import "./image-link-rule-config.styl"
</style>
