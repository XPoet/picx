/**
 * Gets a string(uuid) that is not repeated
 * @returns uuid {string}
 */
const getUuid = () => {
  return Number(Math.random().toString().substr(2, 5) + Date.now()).toString(36)
}

export default getUuid
