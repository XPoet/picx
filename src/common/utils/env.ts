/* eslint-disable no-restricted-syntax */
import { Recordable, ViteEnv } from '@/common/model/vite-config.model'

// Read all environment variable configuration files to process.env
export default function wrapperEnv(envConf: Recordable): ViteEnv {
  const ret: any = {}

  for (const envName of Object.keys(envConf)) {
    let realName = envConf[envName].replace(/\\n/g, '\n')
    if (realName === 'true') {
      realName = true
    } else if (realName === 'false') {
      realName = false
    }

    if (envName === 'VITE_PORT') {
      realName = Number(realName)
    }
    ret[envName] = realName
    process.env[envName] = realName
  }
  return ret
}
