import getType from './get-type'

/**
 * 根据 object 每个 key 上值的数据类型，赋对应的初始值
 * @param object
 */
const cleanObject = (object: any) => {
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

export default cleanObject
