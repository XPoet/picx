import i18n from '@/plugins/vue/i18n'

ElMessageBox.prompt(i18n.global.t('config_page.message_7'), i18n.global.t('tip'), {
  confirmButtonText: i18n.global.t('confirm'),
  cancelButtonText: i18n.global.t('cancel')
}).then(async ({ value }) => {
  if (!value) {
    return
  }

  // TODO
  console.log('new dir: ', value)
})
