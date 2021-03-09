/**
 * 获取一串不会重复的字符（UUID）
 * @returns uuid {string}
 */
const getUuid = () => {
  return Number(Math.random().toString().substr(2, 5) + Date.now()).toString(36);
}

export default getUuid


