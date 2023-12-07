import { ImageLinkRuleModel } from '@/common/model'
import { ImgLinkRuleActionsEnum } from '@/stores/modules/user-settings/types'

export const imgLinkRuleVerification = (
  rule: ImageLinkRuleModel,
  type: ImgLinkRuleActionsEnum,
  $t: any,
  callback: any
) => {
  const typeTxt =
    type === ImgLinkRuleActionsEnum.add
      ? $t('settings.link_rule.add')
      : $t('settings.link_rule.edit')
  const tmpList = []

  if (!rule.rule.includes('{{path}}')) {
    ElMessage.error($t('settings.link_rule.error_msg_2', { action: typeTxt, path: '{{path}}' }))
    callback(false)
    return
  }

  if (!rule.rule.includes('{{owner}}')) {
    tmpList.push('{{owner}}')
  }

  if (!rule.rule.includes('{{repo}}')) {
    tmpList.push('{{repo}}')
  }

  if (!rule.rule.includes('{{branch}}')) {
    tmpList.push('{{branch}}')
  }

  if (tmpList.length) {
    const confirmTxt = $t('settings.link_rule.error_msg_3', {
      action: typeTxt,
      rules: tmpList.join('、')
    })

    ElMessageBox.confirm(confirmTxt, `${typeTxt}`, {
      type: 'warning',
      showClose: type === ImgLinkRuleActionsEnum.add,
      showCancelButton: type === ImgLinkRuleActionsEnum.add
    })
      .then(() => {
        callback(true)
      })
      .catch(() => {
        callback(false)
      })
  } else {
    callback(true)
  }
}
