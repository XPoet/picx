import type { Plugin, Ref } from 'vue'

export interface TranslateFunction {
  (key: string, named?: unknown, options?: unknown): string
}

interface I18nComposer {
  t: TranslateFunction
}

type I18nInstance = Plugin & {
  global: I18nComposer
}

export function createI18n(options: object): I18nInstance

export function useI18n(): I18nComposer & {
  locale: Ref<string>
}
