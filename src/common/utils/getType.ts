/**
 * 获取 JS 基本数据类型
 * @param data
 * @returns {string} array | string | number ...
 */
const getType = (data: any) => {
  const type = Object.prototype.toString.call(data).split(' ')[1]
  return type.substring(0, type.length - 1).toLowerCase()
}

export default getType


