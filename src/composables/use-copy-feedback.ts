import { shallowRef } from 'vue'

export const copyFailureText = shallowRef<string | null>(null)
export function showCopyFailure(text: string) {
  copyFailureText.value = text
}
export function clearCopyFailure(text?: string) {
  if (text === undefined || copyFailureText.value === text)
    copyFailureText.value = null
}
