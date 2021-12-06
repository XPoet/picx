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
  ElDialog,
  ElSwitch,
  ElTimeSelect
} from 'element-plus'

/**
 * Introduces component on demand.
 * Vite Plugin: https://github.com/element-plus/vite-plugin-element-plus
 * @param app {App}
 */
export default function styleImport(app: App) {
  ;[
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
    ElDialog,
    ElSwitch,
    ElTimeSelect
  ].forEach((v: any) => {
    app.use(v)
  })
}
