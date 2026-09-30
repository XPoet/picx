/// <reference types="@plugin-web-update-notification/vite" />

import type { Component, Directive, VNode } from 'vue'
import type { TranslateFunction } from 'vue-i18n'

declare module 'vue' {
  interface GlobalComponents {
    [componentName: string]: Component
  }

  interface GlobalDirectives {
    [directiveName: string]: Directive
  }

  interface ComponentCustomProperties {
    $t: TranslateFunction
  }
}

declare global {
  namespace JSX {
    interface Element extends VNode {}

    interface IntrinsicElements {
      [elementName: string]: unknown
    }

    interface IntrinsicAttributes {}
  }

  interface Window {
    pluginWebUpdateNotice_?: {
      setLocale: (locale: 'zh_CN' | 'zh_TW' | 'en_US') => void
      checkUpdate: () => void
      dismissUpdate: () => void
      closeNotification: () => void
      onClickRefresh?: (version: string) => void
      onClickDismiss?: (version: string) => void
    }
  }
}

export {}
