import type { UserSettingsModel } from '@/common/model'
import { CompressEncoderEnum, ImageLinkTypeEnum, ImageSortEnum, WatermarkPositionEnum } from '@/common/model'

export interface SettingsPayload {
  imageName?: Partial<Omit<UserSettingsModel['imageName'], 'addPrefix'>> & { addPrefix?: Partial<UserSettingsModel['imageName']['addPrefix']> }
  compress?: Partial<UserSettingsModel['compress']>
  management?: Partial<UserSettingsModel['management']>
  imageLinkType?: Partial<UserSettingsModel['imageLinkType']>
  imageLinkFormat?: Partial<UserSettingsModel['imageLinkFormat']>
  deploy?: Partial<UserSettingsModel['deploy']>
  watermark?: Partial<UserSettingsModel['watermark']>
  starred?: boolean
  showAnnouncement?: boolean
}
const invalid = Symbol('invalid-settings')
type Reader = (value: unknown) => unknown
const boolean: Reader = value => typeof value === 'boolean' ? value : invalid
const string: Reader = value => typeof value === 'string' ? value : invalid
const number: Reader = value => typeof value === 'number' && Number.isFinite(value) ? value : invalid
const enumValue = (values: string[]): Reader => value => typeof value === 'string' && values.includes(value) ? value : invalid
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
function object(fields: Record<string, Reader>, requireField = false): Reader {
  return (value) => {
    if (!record(value))
      return invalid
    const output: Record<string, unknown> = {}
    for (const [key, reader] of Object.entries(fields)) {
      if (!Object.hasOwn(value, key))
        continue
      const read = reader(value[key])
      if (read === invalid)
        return invalid
      output[key] = read
    }
    return requireField && !Object.keys(output).length ? invalid : output
  }
}
const linkRule: Reader = (value) => {
  if (!record(value) || !['id', 'name', 'rule'].every(key => typeof value[key] === 'string'))
    return invalid
  return object({ id: string, name: string, rule: string, editable: boolean })(value)
}
const rules: Reader = (value) => {
  if (!record(value))
    return invalid
  const entries: [string, unknown][] = []
  for (const [key, rule] of Object.entries(value)) {
    const selected = linkRule(rule)
    if (['__proto__', 'constructor', 'prototype'].includes(key.toLowerCase()) || selected === invalid || !record(selected) || selected.name !== key)
      return invalid
    entries.push([key, selected])
  }
  return Object.fromEntries(entries)
}
const formats: Reader = (value) => {
  if (!Array.isArray(value))
    return invalid
  const output: unknown[] = []
  for (const format of value) {
    if (!record(format) || typeof format.name !== 'string' || typeof format.format !== 'string')
      return invalid
    output.push({ name: format.name, format: format.format })
  }
  return output
}
const payloadReader = object({
  imageName: object({ enableHash: boolean, enableTimestamp: boolean, addPrefix: object({ enable: boolean, prefix: string }) }),
  compress: object({ enable: boolean, encoder: enumValue(Object.values(CompressEncoderEnum)) }),
  management: object({ sort: enumValue(Object.values(ImageSortEnum)) }),
  imageLinkType: object({ selected: string, presetList: rules }),
  imageLinkFormat: object({ enable: boolean, selected: string, presetList: formats }),
  deploy: object({ customDomain: string }),
  watermark: object({ enable: boolean, text: string, fontSize: number, position: enumValue(Object.values(WatermarkPositionEnum)), textColor: string, opacity: number, rotate: number, gap: number }),
  starred: boolean,
  showAnnouncement: boolean,
}, true)
/** 反序列化边界：reader 已逐字段验证类型并重建递归允许字段对象。 */
export function readSettingsPayload(value: unknown): SettingsPayload | null {
  const payload = payloadReader(value)
  return payload === invalid ? null : payload as SettingsPayload
}
export function projectSettings(settings: UserSettingsModel): UserSettingsModel {
  return {
    imageName: { enableHash: settings.imageName.enableHash, enableTimestamp: settings.imageName.enableTimestamp, addPrefix: { enable: settings.imageName.addPrefix.enable, prefix: settings.imageName.addPrefix.prefix } },
    compress: { enable: settings.compress.enable, encoder: settings.compress.encoder },
    management: { sort: settings.management.sort },
    imageLinkType: { selected: settings.imageLinkType.selected, presetList: Object.fromEntries(Object.entries(settings.imageLinkType.presetList).map(([key, rule]) => [key, { id: rule.id, name: rule.name, rule: rule.rule, ...(rule.editable === undefined ? {} : { editable: rule.editable }) }])) },
    imageLinkFormat: { enable: settings.imageLinkFormat.enable, selected: settings.imageLinkFormat.selected, presetList: settings.imageLinkFormat.presetList.map(format => ({ name: format.name, format: format.format })) },
    deploy: { customDomain: settings.deploy.customDomain },
    watermark: { enable: settings.watermark.enable, text: settings.watermark.text, fontSize: settings.watermark.fontSize, position: settings.watermark.position, textColor: settings.watermark.textColor, opacity: settings.watermark.opacity, rotate: settings.watermark.rotate, gap: settings.watermark.gap },
    ...(settings.starred === undefined ? {} : { starred: settings.starred }),
    ...(settings.showAnnouncement === undefined ? {} : { showAnnouncement: settings.showAnnouncement }),
  }
}
export function mergeSettings(base: UserSettingsModel, patch: SettingsPayload): UserSettingsModel {
  const standardRules = Object.fromEntries(Object.entries(base.imageLinkType.presetList).filter(([name]) => Object.values<string>(ImageLinkTypeEnum).includes(name)))
  const formatList = patch.imageLinkFormat?.presetList
    ? [...new Map([...base.imageLinkFormat.presetList, ...patch.imageLinkFormat.presetList].map(format => [format.name, format])).values()]
    : base.imageLinkFormat.presetList
  return projectSettings({
    ...base,
    ...patch,
    imageName: { ...base.imageName, ...patch.imageName, addPrefix: { ...base.imageName.addPrefix, ...patch.imageName?.addPrefix } },
    compress: { ...base.compress, ...patch.compress },
    management: { ...base.management, ...patch.management },
    imageLinkType: { ...base.imageLinkType, ...patch.imageLinkType, presetList: patch.imageLinkType?.presetList ? { ...standardRules, ...patch.imageLinkType.presetList } : base.imageLinkType.presetList },
    imageLinkFormat: { ...base.imageLinkFormat, ...patch.imageLinkFormat, presetList: formatList },
    deploy: { ...base.deploy, ...patch.deploy },
    watermark: { ...base.watermark, ...patch.watermark },
  })
}
