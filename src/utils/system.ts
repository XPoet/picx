import axios from 'axios'
import { LanguageEnum } from '@/common/model'

/**
 * 判断系统是否是黑暗模式
 */
export const isDarkModeOfSystem = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 获取系统名称
 * @returns 'mac' | 'win' | 'linux' | null
 */
export const getOSName = (): 'mac' | 'win' | 'linux' | null => {
  const { platform } = navigator
  if (platform.includes('Mac')) {
    return 'mac'
  }
  if (platform.includes('Win')) {
    return 'win'
  }
  if (platform.includes('Linux')) {
    return 'linux'
  }
  return null
}

/**
 * 获取本机 IP 地址的所属地区
 * CN 中国大陆
 * HK 中国香港
 * TW 中国台湾
 * SG 新加坡
 * JP 日本
 * US 美国
 */
export const getRegionByIP = async (): Promise<'CN' | 'HK' | 'TW' | 'SG' | 'US'> => {
  try {
    // 获取 IP 地址
    const res = await axios.get('https://api.ipify.org?format=json')

    // 调用 ipapi.co 查询 IP 所在的地区或国家
    const res2 = await axios.get(`https://ipapi.co/${res.data.ip}/country/`)

    return Promise.resolve(res2.data)
  } catch (error) {
    return Promise.resolve('CN')
  }
}

/**
 * 根据地区编码获取语言枚举
 * @param region
 */
export const getLanguageByRegion = (region: string): LanguageEnum => {
  if (region === 'CN') {
    return LanguageEnum.zhCN
  }
  if (region === 'HK' || region === 'TW' || region === 'MO') {
    return LanguageEnum.zhTW
  }
  return LanguageEnum.en
}
