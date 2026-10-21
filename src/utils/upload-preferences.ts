import type { UserSettingsModel } from '@/common/model'
import { CompressEncoderEnum, WatermarkPositionEnum } from '@/common/model'

export type UploadPreferences = Pick<UserSettingsModel, 'imageName' | 'compress' | 'watermark'>
export type UploadPreferencesPatch = Partial<UploadPreferences>
export type NamingMode = 'hash' | 'timestamp' | 'original'

export function namingMode(value: UserSettingsModel['imageName']): NamingMode {
  return value.enableTimestamp ? 'timestamp' : value.enableHash ? 'hash' : 'original'
}
export function changeNamingMode(value: UserSettingsModel['imageName'], mode: NamingMode): UserSettingsModel['imageName'] {
  return { ...value, addPrefix: { ...value.addPrefix }, enableTimestamp: mode === 'timestamp', enableHash: mode === 'hash' }
}
export function validPrefix(value: string) {
  return value.length <= 100 && !/[\\/]/u.test(value) && Array.from(value).every(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127)
}
export function validWatermark(value: UserSettingsModel['watermark']) {
  const range = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max
  return value.text.length <= 20 && /^#[a-f\d]{6}$/i.test(value.textColor)
    && Object.values(WatermarkPositionEnum).includes(value.position)
    && range(value.fontSize, 1, 200) && range(value.opacity, 0.1, 1)
    && range(value.rotate, -45, 45) && range(value.gap, 20, 200)
}
export function validUploadPreferences(value: UploadPreferences) {
  return validPrefix(value.imageName.addPrefix.prefix)
    && !(value.imageName.enableTimestamp && value.imageName.enableHash)
    && Object.values(CompressEncoderEnum).includes(value.compress.encoder)
    && validWatermark(value.watermark)
}
