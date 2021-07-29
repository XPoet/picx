import type { App } from 'vue'
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
  ElFormItem,
  ElDialog
} from 'element-plus'

// Introduces component on demand.
export default function styleImport(app: App) {
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
    .use(ElDialog)
  return app
}
