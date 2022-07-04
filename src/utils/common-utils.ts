/**
 * Get JavaScript basic data types
 * @param data
 * @returns {string} array | string | number ...
 */
export const getType = (data: string) => {
  const type = Object.prototype.toString.call(data).split(' ')[1]
  return type.substring(0, type.length - 1).toLowerCase()
}

/**
 * Gets a string(uuid) that is not repeated
 * @returns uuid {string}
 */
export const getUuid = () => {
  return Number(Math.random().toString().substr(2, 5) + Date.now()).toString(36)
}

/**
 * get localStorage value
 * @param key
 * @returns {*}
 */
export const getLocalItem = (key: string) => {
  const temp = window.localStorage.getItem(key)
  return temp ? JSON.parse(temp) : null
}
