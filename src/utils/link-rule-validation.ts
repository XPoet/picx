import type { ImageLinkRuleModel } from '@/common/model'

export type LinkRuleError = 'name-required' | 'name-invalid' | 'name-duplicate' | 'path-required' | 'variable-invalid' | 'protocol-invalid' | 'url-invalid'
export function validateLinkRule(rule: Pick<ImageLinkRuleModel, 'name' | 'rule'>, rules: Record<string, ImageLinkRuleModel>, originalName?: string): LinkRuleError | null {
  const name = rule.name.trim()
  if (!name)
    return 'name-required'
  if (name.length > 60 || ['__proto__', 'prototype', 'constructor'].includes(name.toLowerCase()))
    return 'name-invalid'
  if (Object.keys(rules).some(key => key !== originalName && key.toLowerCase() === name.toLowerCase()))
    return 'name-duplicate'
  if (!rule.rule.includes('{{path}}'))
    return 'path-required'
  const variables = ['owner', 'repo', 'branch', 'path']
  let invalid = false
  const substituted = rule.rule.trim().replace(/\{\{([^{}]*)\}\}/g, (_, key: string) => {
    if (!variables.includes(key))
      invalid = true
    return 'example'
  })
  if (invalid || /[{}]/.test(substituted))
    return 'variable-invalid'
  try {
    const url = new URL(substituted)
    if (!['https:', 'http:'].includes(url.protocol))
      return 'protocol-invalid'
    if (url.username || url.password)
      return 'url-invalid'
    return null
  }
  catch { return 'url-invalid' }
}
