import i18n from '@/plugins/vue/i18n'

/**
 * 获取 JavaScript 数据类型
 * @param data
 * @returns {string} array | string | number | boolean ...
 */
export const getType = (data: string): string => {
  const type = Object.prototype.toString.call(data).split(' ')[1]
  return type.substring(0, type.length - 1).toLowerCase()
}

/**
 * 获取一个永不重复的 UUID
 * @returns uuid {string}
 */
export const getUuid = () => {
  return Number(Math.random().toString().substr(2, 5) + Date.now()).toString(36)
}

/**
 * 复制文本到系统剪贴板
 * @param txt
 * @param callback
 */
export const copyText = (txt: string, callback: any) => {
  navigator.clipboard.writeText(txt).then(() => {
    // eslint-disable-next-line no-unused-expressions
    callback && callback()
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
        object[key] = ''
        break

      case 'array':
        object[key] = []
        break

      case 'number':
        object[key] = 0
        break

      case 'boolean':
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
export const deepAssignObject = (obj1: object, obj2: object) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj2) {
    // @ts-ignore
    if (getType(obj2[key]) !== 'object') {
      if (obj1) {
        // @ts-ignore
        obj1[key] = obj2[key]
      }
    } else {
      // @ts-ignore
      // eslint-disable-next-line no-lonely-if
      if (obj1[key]) {
        // @ts-ignore
        deepAssignObject(obj1[key], obj2[key])
      }
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
  timestamp: number = Date.now()
) => {
  function padLeftZero(str: string) {
    return `00${str}`.substr(str.length)
  }
  const date = new Date(timestamp)

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, `${date.getFullYear()}`.substr(4 - RegExp.$1.length))
  }

  const obj = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (new RegExp(`(${key})`).test(fmt)) {
      // @ts-ignore
      const str = `${obj[key]}`
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : padLeftZero(str))
    }
  }
  return fmt
}

/**
 * 节流函数
 * @param func
 * @param wait
 */
// eslint-disable-next-line no-unused-vars
export const throttle = <T extends (...args: any[]) => void>(func: T, wait: number = 500): T => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: any[]

  function throttled(...args: any[]) {
    lastArgs = args

    if (!timer) {
      timer = setTimeout(() => {
        func(...lastArgs)
        timer = undefined
      }, wait)
    }
  }

  return throttled as unknown as T
}

/**
 * 设置 Window 标题
 * @param title
 */
export const setWindowTitle = (title: string) => {
  if (title) {
    ;(<any>window).document.title = `${i18n.global.t(title)} | PicX`
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
  function flattenObject(obj: object) {
    const result = {}

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        const nested = flattenObject(value)

        // 使用 Object.entries() 处理嵌套对象的键
        // eslint-disable-next-line no-restricted-syntax
        for (const [nestedKey, nestedValue] of Object.entries(nested)) {
          // @ts-ignore
          result[`${key}.${nestedKey}`] = nestedValue
        }
      } else {
        // @ts-ignore
        result[key] = value
      }
    }

    return result
  }

  return (
    Object.entries(flattenObject(obj1)).toString() ===
    Object.entries(flattenObject(obj2)).toString()
  )
}
