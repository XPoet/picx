import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/locales/en.json'
import zhCN from '@/locales/zh-CN.json'
import zhTW from '@/locales/zh-TW.json'

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]: [string, unknown]) => {
    const path = `${prefix}${key}`
    return typeof item === 'string' ? [[path, item]] : item && typeof item === 'object' ? Object.entries(flatten(item, `${path}.`)) : []
  }))
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', 'build', 'coverage'].includes(entry.name))
      return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:vue|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : []
  })
}

describe('三语翻译完整性', () => {
  const reference = flatten(zhCN)
  for (const [name, locale] of Object.entries({ zhTW, en })) {
    it(`${name} 键与插值参数保持完整`, () => {
      const values = flatten(locale)
      expect(Object.keys(values).sort()).toEqual(Object.keys(reference).sort())
      for (const [key, text] of Object.entries(values)) {
        const variables = (message: string) => [...new Set([...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort()
        expect(text.trim(), key).not.toBe('')
        expect(variables(text), key).toEqual(variables(reference[key]))
      }
    })
  }
  it('源码使用的静态翻译键均存在；检查范围明确排除产物与自动声明', () => {
    const missing: string[] = []
    for (const file of sourceFiles('src')) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/\b(?:\$t|t)\(\s*['"]([^'"]+)['"]/g)) {
        if (!Object.hasOwn(reference, match[1]))
          missing.push(`${file}: ${match[1]}`)
      }
    }
    expect(missing).toEqual([])
  })
})
