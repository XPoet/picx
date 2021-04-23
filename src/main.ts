import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'
import {
  ElButton,
  ElSelect,
  ElTooltip,
  ElForm,
  ElInput,
  ElBadge,
  ElIcon,
  ElRadioGroup,
  ElRadio,
  ElLoading,
  ElLink,
  ElStep,
  ElSteps,
  ElCheckbox,
  ElTag,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElOption,
  ElFormItem
} from 'element-plus'

import './style.styl'

createApp(App)
  .use(router)
  .use(store)
  // 按需载入 Element Plus
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
  .mount('#app')
