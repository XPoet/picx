/**
 * Get JavaScript basic data types
 * @param data
 * @returns {string} array | string | number ...
 */
const getType = (data: string) => {
  const type = Object.prototype.toString.call(data).split(' ')[1]
  return type.substring(0, type.length - 1).toLowerCase()
}

export default getType
