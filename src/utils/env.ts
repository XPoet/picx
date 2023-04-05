import { Recordable, ViteEnv } from '@/common/model'

export default function wrapperEnv(envConf: Recordable): ViteEnv {
  const ret: any = {}

  // eslint-disable-next-line no-restricted-syntax
  for (const envName of Object.keys(envConf)) {
    let realName = envConf[envName].replace(/\\n/g, '\n')
    if (realName === 'true') {
      realName = true
    } else if (realName === 'false') {
      realName = false
    }
    ret[envName] = realName
    process.env[envName] = realName
  }
  return ret
}
