import { App } from 'vue'
import {
  ElIcon,
  ElLoading,
  ElButton,
  ElSelect,
  ElTooltip,
  ElForm,
  ElInput,
  ElBadge,
  ElRadioGroup,
  ElRadio,
  ElStep,
  ElSteps,
  ElCheckbox,
  ElTag,
  ElLink,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElOption,
  ElFormItem
} from 'element-plus'

// 按需载入 Element Plus 组件
export default function importUIFramework(app: App) {
  app
    .use(ElButton)
    .use(ElSelect)
    .use(ElTooltip)
    .use(ElForm)
    .use(ElInput)
    .use(ElBadge)
    .use(ElIcon)
    .use(ElRadioGroup)
    .use(ElRadio)
    .use(ElLoading)
    .use(ElStep)
    .use(ElSteps)
    .use(ElCheckbox)
    .use(ElTag)
    .use(ElLink)
    .use(ElDropdown)
    .use(ElDropdownItem)
    .use(ElDropdownMenu)
    .use(ElOption)
    .use(ElFormItem)
  return app
}
