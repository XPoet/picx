import { expect, openNavigation, test } from './fixtures'

test('旧 /config 与 /login 进入真实连接页，focus 单次消费且 Token 为空', async ({ page, picx }) => {
  await picx.open('/config?focus=1')
  await expect(page).toHaveURL(/#\/\?jump=0&returnTo=(?:%2F|\/)upload$/)
  const token = page.getByLabel('GitHub Token', { exact: true })
  await expect(token).toBeFocused()
  await expect(token).toHaveValue('')
  await expect(page.locator('.config-page-container')).toHaveCount(0)
  await page.goto('/images-hosting/#/login?jump=0&returnTo=/settings')
  await expect(page).toHaveURL(/#\/\?jump=0&returnTo=(?:%2F|\/)settings$/)
  await expect(page.getByRole('button', { name: '验证并连接', exact: true })).toBeVisible()
})

test('完整配置通过旧链接回上传，保留路径并支持返回', async ({ page, picx }) => {
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready' })
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
  await page.goto('/images-hosting/#/config?auto=1')
  await expect(page).toHaveURL(/#\/upload$/)
  await expect(page.getByTestId('saved-upload-directory')).toHaveText('/')
  await expect(page.locator('.config-page-container')).toHaveCount(0)
  await page.goto('/images-hosting/#/config?focus=1')
  await expect(page.getByLabel('GitHub Token', { exact: true })).toBeFocused()
  await page.goBack()
  await expect(page).toHaveURL(/#\/upload$/)
  await expect(page.getByTestId('saved-upload-directory')).toHaveText('/')
})

test('auto 初始化单次消费，刷新不重复创建仓库或 README', async ({ page, picx }) => {
  let creates = 0
  let readmes = 0
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (request.method() === 'POST' && url.pathname === '/user/repos')
      creates += 1
    if (request.method() === 'PUT' && url.pathname.endsWith('/contents/README.md'))
      readmes += 1
  })
  await picx.open('/config?auto=1', { partialConfiguration: true, connectionScenario: 'initialize' })
  await expect(page).toHaveURL(/#\/upload$/)
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
  expect(creates).toBe(1)
  expect(readmes).toBe(1)
  await page.reload()
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
  expect(creates).toBe(1)
  expect(readmes).toBe(1)
  expect(await page.evaluate(() => location.hash.includes('auto='))).toBe(false)
})

test('旧 auto 入口仅有授权存储时也能验证后进入上传页', async ({ page, picx }) => {
  await picx.open('/config?auto=1', { savedOAuth: true, connectionScenario: 'ready' })
  await expect(page).toHaveURL(/#\/upload$/)
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
})

test('已有仓库未选目录从旧入口进入共享弹窗，刷新仍能配置', async ({ page, picx }) => {
  await picx.open('/config', { savedCredential: true, missingDirectory: true, connectionScenario: 'ready' })
  await expect(page).toHaveURL(/#\/upload$/)
  const dialog = page.getByRole('dialog', { name: '配置上传目录', exact: true })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('radio', { name: '根目录', exact: true }).check()
  await dialog.getByRole('button', { name: '保存目录', exact: true }).click()
  await expect(page.getByTestId('saved-upload-directory')).toHaveText('/')
})

for (const source of ['outer', 'hash'] as const) {
  test(`OAuth ${source} 回调直接验证连接并清理参数，刷新不重复交换`, async ({ page, picx }) => {
    let exchanges = 0
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/github-authorize')
        exchanges += 1
    })
    await picx.open('/?jump=0', { connectionScenario: 'ready' })
    const path = source === 'outer'
      ? '/images-hosting/?code=fixture-callback&state=%2Fsettings#/login'
      : '/images-hosting/#/config?code=fixture-callback&state=%2Fsettings'
    await page.goto(path)
    await expect(page).toHaveURL(/\/images-hosting\/#\/settings$/)
    await expect(page.getByRole('region', { name: '上传处理', exact: true })).toBeVisible()
    expect(exchanges).toBe(1)
    expect(await page.evaluate(() => ['code', 'state', 'auto'].every(key => !new URLSearchParams(location.search).has(key) && !location.hash.includes(`${key}=`)))).toBe(true)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_AUTHORIZATION') ?? '{}').code)).toBe('')
    await page.reload()
    await expect(page).toHaveURL(/#\/settings$/)
    expect(exchanges).toBe(1)
  })
}

test('授权拒绝与交换失败清理外层和 Hash 参数并提供恢复', async ({ page, picx }) => {
  await picx.open('/?jump=0', { connectionScenario: 'ready' })
  await page.goto('/images-hosting/?error=fixture-denied&error_description=not-shown#/login?state=%2Fupload')
  await expect(page.getByRole('alert')).toHaveText('GitHub 授权未完成，请重新授权。')
  expect(await page.evaluate(() => location.search)).toBe('')
  expect(await page.evaluate(() => location.hash.includes('state='))).toBe(false)
  await page.route('https://apis.xpoet.cn/api/github-authorize?*', route => route.abort('internetdisconnected'))
  await page.goto('/images-hosting/?code=fixture-callback#/login')
  await expect(page.getByRole('alert')).toHaveText('网络请求失败，请重试。')
  expect(await page.evaluate(() => location.search)).toBe('')
  await expect(page.getByRole('button', { name: '通过 GitHub 授权登录', exact: true })).toBeEnabled()
})

test('重连返回白名单目标，配置导航消失且教程地址保留', async ({ page, picx }, info) => {
  await picx.open('/?jump=0&returnTo=/settings', { connectionScenario: 'ready' })
  await expect(page.getByRole('link', { name: '授权教程', exact: true })).toHaveAttribute('href', 'https://picx-docs.xpoet.cn/usage-guide/config.html#github-oauth-授权登录')
  await page.getByLabel('GitHub Token', { exact: true }).fill('fixture-invalid-credential')
  await page.getByRole('button', { name: '验证并连接', exact: true }).click()
  await expect(page).toHaveURL(/#\/settings$/)
  await openNavigation(page)
  const navigation = page.getByRole('navigation', { name: '主导航' })
  await expect(navigation.getByRole('link', { name: '图床配置', exact: true })).toHaveCount(0)
  await navigation.getByRole('link', { name: '上传图片', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
  if (info.project.name === 'desktop-chrome') {
    await page.setViewportSize({ width: 1440, height: 1080 })
    await page.screenshot({ path: 'docs/UI/evidence/p2/t015-connected-upload-1440.png', fullPage: true })
  }
})
