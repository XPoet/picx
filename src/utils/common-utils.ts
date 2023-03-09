/**
 * 获取 JavaScript 数据类型
 * @param data
 * @returns {string} array | string | number ...
 */
export const getType = (data: string) => {
  const type = Object.prototype.toString.call(data).split(' ')[1]
  return type.substring(0, type.length - 1).toLowerCase()
}

/**
 * 生成一个永不重复的 UUID
 * @returns uuid {string}
 */
export const generateUuid = () => {
  return Number(Math.random().toString().substr(2, 5) + Date.now()).toString(36)
}

/**
 * 获取 localStorage 值
 * @param key
 * @returns {*}
 */
export const getLocalItem = (key: string) => {
  const temp = window.localStorage.getItem(key)
  return temp ? JSON.parse(temp) : null
}

/**
 * 复制文本到系统剪贴板
 * @param txt
 * @param callback
 */
export const copyText = (txt: string, callback: any) => {
  navigator.clipboard.writeText(txt).then(() => {
    callback()
  })
}

/**
 * 根据 object 每个 key 上值的数据类型，赋对应的初始值
 * @param object
 */
export const cleanObject = (object: any) => {
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const key in object) {
    // eslint-disable-next-line default-case
    switch (getType(object[key])) {
      case 'object':
        cleanObject(object[key])
        break

      case 'string':
        // eslint-disable-next-line no-param-reassign
        object[key] = ''
        break

      case 'array':
        // eslint-disable-next-line no-param-reassign
        object[key] = []
        break

      case 'number':
        // eslint-disable-next-line no-param-reassign
        object[key] = 0
        break

      case 'boolean':
        // eslint-disable-next-line no-param-reassign
        object[key] = false
        break
    }
  }
}

/**
 * 将 obj2 对象的值深度赋值给 obj1 对象
 * @param obj1{Object}
 * @param obj2{Object}
 */
export const deepAssignObject = (obj1: object, obj2: object): any => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj2) {
    // @ts-ignore
    if (getType(obj2[key]) !== 'object') {
      if (obj1) {
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        obj1[key] = obj2[key]
      }
    } else {
      // @ts-ignore
      deepAssignObject(obj1[key], obj2[key])
    }
  }
}
