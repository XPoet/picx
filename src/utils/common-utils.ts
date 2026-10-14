import i18n from '@/plugins/vue/i18n'

/**
 * 获取 JavaScript 数据类型
 * @param data
 * @returns {string} array | string | number | boolean ...
 */
export const getType = (data: unknown): string => {
  const type = Object.prototype.toString.call(data).split(' ')[1]
  return type.substring(0, type.length - 1).toLowerCase()
}

/**
 * 获取一个永不重复的 UUID
 * @returns uuid {string}
 */
export const getUuid = () => {
  return Number(Math.random().toString().substring(2, 4) + Date.now()).toString(36)
}

/**
 * 复制文本到系统剪贴板
 * @param txt
 * @param callback
 */
export const copyText = (txt: string, callback?: () => void) => {
  navigator.clipboard.writeText(txt).then(() => {
    callback?.()
  })
}

/**
 * 根据 object 每个 key 上值的数据类型，赋对应的初始值
 * @param object
 */
export const cleanObject = (object: object) => {
  for (const key of Object.keys(object)) {
    const value = Reflect.get(object, key)

    switch (getType(value)) {
      case 'object':
        cleanObject(value as object)
        break

      case 'string':
        Reflect.set(object, key, '')
        break

      case 'array':
        Reflect.set(object, key, [])
        break

      case 'number':
        Reflect.set(object, key, 0)
        break

      case 'boolean':
        Reflect.set(object, key, false)
        break
    }
  }
}

/**
 * 将 obj2 对象的值深度赋值给 obj1 对象
 * @param obj1 赋值目标。
 * @param obj2 数据来源。
 */
export const deepAssignObject = (obj1: object, obj2: object) => {
  for (const key of Object.keys(obj2)) {
    const sourceValue = Reflect.get(obj2, key)

    if (getType(sourceValue) !== 'object') {
      Reflect.set(obj1, key, sourceValue)
    }
    else {
      if (!Object.hasOwn(obj1, key)) {
        Reflect.set(obj1, key, {})
      }
      deepAssignObject(Reflect.get(obj1, key) as object, sourceValue as object)
    }
  }
}

/**
 * 格式化时间日期
 * @param fmt 格式
 * @param timestamp 时间戳
 */
export const formatDatetime = (
  fmt: string = 'yyyy-MM-dd hh:mm:ss',
  timestamp: number = Date.now(),
) => {
  function padLeftZero(str: string) {
    return `00${str}`.substr(str.length)
  }
  const date = new Date(timestamp)

  const yearMatch = /(y+)/.exec(fmt)
  if (yearMatch) {
    const token = yearMatch[1]
    fmt = fmt.replace(token, `${date.getFullYear()}`.slice(4 - token.length))
  }

  const obj = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
  }

  for (const [pattern, value] of Object.entries(obj)) {
    const match = new RegExp(`(${pattern})`).exec(fmt)

    if (match) {
      const token = match[1]
      const stringValue = `${value}`
      fmt = fmt.replace(token, token.length === 1 ? stringValue : padLeftZero(stringValue))
    }
  }
  return fmt
}

/**
 * 节流函数
 * @param func
 * @param wait
 */

export const throttle = <Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number = 500,
): ((...args: Args) => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Args

  function throttled(...args: Args) {
    lastArgs = args

    if (!timer) {
      timer = setTimeout(() => {
        func(...lastArgs)
        timer = undefined
      }, wait)
    }
  }

  return throttled
}

/**
 * 设置 Window 标题
 * @param title
 */
export const setWindowTitle = (title: string) => {
  if (title) {
    document.title = `${i18n.global.t(title)} | PicX`
  }
}

/**
 * 深度判断两个对象是否相等
 * @param obj1 对象 1
 * @param obj2 对象 2
 * @return {boolean} true | false
 */
export const deepObjectEqual = (obj1: object, obj2: object): boolean => {
  // 多维对象转换为一维对象
  function flattenObject(obj: object): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        const nested = flattenObject(value)

        // 使用 Object.entries() 处理嵌套对象的键

        for (const [nestedKey, nestedValue] of Object.entries(nested)) {
          result[`${key}.${nestedKey}`] = nestedValue
        }
      }
      else {
        result[key] = value
      }
    }

    return result
  }

  return (
    Object.entries(flattenObject(obj1)).toString()
    === Object.entries(flattenObject(obj2)).toString()
  )
}
