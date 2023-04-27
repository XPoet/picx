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
