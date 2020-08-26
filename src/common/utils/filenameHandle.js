import getUuid from "./getUuid";

export const filenameHandle = (filename) => {
  const splitIndex = filename.lastIndexOf('.')
  const name = filename.substr(0, splitIndex)
  const suffix = filename.substr(splitIndex + 1, filename.length)
  return {
    name: name,
    hash: getUuid(),
    suffix: suffix,
  }
}

export const isImage = (suffix) => {
  return /(png|jpg|gif|jpeg|webp)$/.test(suffix)
}
