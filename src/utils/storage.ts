/**
 * 获取 sessionStorage 的值
 * @param key
 */
export const getSession = (key: string) => {
  const temp = window.sessionStorage.getItem(key)
  return temp ? JSON.parse(temp) : null
}

/**
 * 设置 sessionStorage
 * @param key
 * @param value
 */
export const setSession = (key: string, value: any) => {
  sessionStorage.setItem(key, JSON.stringify(value))
}

/**
 * 获取 localStorage 值
 * @param key
 */
export const getLocal = (key: string) => {
  const temp = window.localStorage.getItem(key)
  return temp ? JSON.parse(temp) : null
}
