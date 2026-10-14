import type { Component, Directive } from 'vue'

export interface FormInstance {
  validate: (callback: (valid: boolean) => void) => Promise<boolean> | void
}

interface MessageHandler {
  close: () => void
}

interface MessageOptions {
  type?: 'success' | 'warning' | 'info' | 'error'
  message?: string
  duration?: number
  offset?: number
  customClass?: string
  showClose?: boolean
  dangerouslyUseHTMLString?: boolean
  onClose?: () => void
}

interface MessageFunction {
  (options: MessageOptions | string): MessageHandler
  success: (options: MessageOptions | string) => MessageHandler
  warning: (options: MessageOptions | string) => MessageHandler
  info: (options: MessageOptions | string) => MessageHandler
  error: (options: MessageOptions | string) => MessageHandler
}

interface LoadingService {
  close: () => void
}

type MessageBoxAction = 'confirm' | 'cancel' | 'close'

interface MessageBoxState {
  inputValue: string
  confirmButtonLoading: boolean
  confirmButtonText: string
}

interface MessageBoxOptions {
  beforeClose?: (
    action: MessageBoxAction,
    instance: MessageBoxState,
    done: () => void,
  ) => void | Promise<void>
  [optionName: string]: unknown
}

export const ElAlert: Component
export const ElBreadcrumb: Component
export const ElBreadcrumbItem: Component
export const ElButton: Component
export const ElCard: Component
export const ElCascader: Component
export const ElCheckbox: Component
export const ElCol: Component
export const ElCollapse: Component
export const ElCollapseItem: Component
export const ElColorPicker: Component
export const ElConfigProvider: Component
export const ElDescriptions: Component
export const ElDescriptionsItem: Component
export const ElDialog: Component
export const ElDivider: Component
export const ElEmpty: Component
export const ElForm: Component
export const ElFormItem: Component
export const ElIcon: Component
export const ElImage: Component
export const ElInput: Component
export const ElInputNumber: Component
export const ElLink: Component
export const ElOption: Component
export const ElPopover: Component
export const ElProgress: Component
export const ElRadio: Component
export const ElRadioGroup: Component
export const ElRow: Component
export const ElSelect: Component
export const ElSwitch: Component
export const ElTable: Component
export const ElTableColumn: Component
export const ElTag: Component
export const ElTooltip: Component
export const ElLoadingDirective: Directive
export const ElMessage: MessageFunction
export const ElMessageBox: {
  confirm: (
    message?: string,
    title?: string,
    options?: MessageBoxOptions,
  ) => Promise<MessageBoxAction>
  prompt: (
    message?: string,
    title?: string,
    options?: MessageBoxOptions,
  ) => Promise<{ value: string, action: MessageBoxAction }>
}
export const ElLoading: {
  service: (options?: object) => LoadingService
}
