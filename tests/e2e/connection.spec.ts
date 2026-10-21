import { expect, openNavigation, test } from './fixtures'

const credential = 'fixture-invalid-credential'

test('Token 先验证后持久化，失败后 Enter 重试与按钮一致', async ({ page, picx }) => {
  let attempts = 0
  await page.route('https://api.github.com/user?*', async (route) => {
    attempts += 1
    if (attempts === 1)
      await route.fulfill({ status: 401, json: { message: 'not shown' } })
    else await route.fallback()
  })
  await picx.open('/?jump=0', { connectionScenario: 'ready' })
  const input = page.getByLabel('GitHub Token', { exact: true })
  await input.fill(credential)
  expect(await page.evaluate(() => localStorage.getItem('PICX_IH_CONFIG'))).toBeNull()
  await input.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('凭据无效，请重新连接。')
  expect(await page.evaluate(() => localStorage.getItem('PICX_IH_CONFIG'))).toBeNull()
  await expect(input).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: '验证并连接', exact: true }).click()
  await expect(page).toHaveURL(/#\/upload$/)
  expect(await page.evaluate(() => {
    const config = JSON.parse(localStorage.getItem('PICX_IH_CONFIG') ?? '{}')
    return { owner: config.owner, branch: config.branch, selectedDir: config.selectedDir, logined: config.logined }
  })).toEqual({ owner: 'fixture-owner', branch: 'master', selectedDir: '/', logined: true })
  expect(attempts).toBe(2)
})

test('网络失败保留表单并可恢复，连接期间防重复提交', async ({ page, picx }) => {
  let attempts = 0
  await page.route('https://api.github.com/user?*', async (route) => {
    attempts += 1
    if (attempts === 1) {
      await route.abort('internetdisconnected')
    }
    else {
      await new Promise(resolve => setTimeout(resolve, 200))
      await route.fallback()
    }
  })
  await picx.open('/?jump=0', { connectionScenario: 'ready' })
  const input = page.getByLabel('GitHub Token', { exact: true })
  await input.fill(credential)
  await input.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('网络请求失败，请重试。')
  const submit = page.getByRole('button', { name: '验证并连接', exact: true })
  await submit.click()
  await expect(submit).toBeDisabled()
  await expect(input).toBeDisabled()
  await expect(page).toHaveURL(/#\/upload$/)
  expect(attempts).toBe(2)
})

test('OAuth App 未安装就地恢复，不显示已连接', async ({ page, picx }) => {
  await picx.open('/?jump=0', { savedOAuth: true, connectionScenario: 'app-missing' })
  await page.getByRole('button', { name: '通过 GitHub 授权登录', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('尚未安装 PicX GitHub App。请先安装并授予仓库权限，再重试。')
  await expect(page.getByRole('link', { name: '安装 PicX GitHub APP', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/#\/\?jump=0$/)
  expect(await page.evaluate(() => localStorage.getItem('PICX_IH_CONFIG'))).toBeNull()
})

test('登录卡片桌面与 375px、长英文暗色及键盘可用', async ({ page, picx }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await picx.open('/?jump=0')
  const cards = page.locator('.connection-card')
  await expect(cards).toHaveCount(2)
  expect(await cards.first().evaluate(element => Math.round(element.getBoundingClientRect().width))).toBe(520)
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p2/t014-login-1440.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  const input = page.getByLabel('GitHub Token', { exact: true })
  await input.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '显示 Token', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(input).toHaveAttribute('type', 'text')
  await page.keyboard.press('Enter')
  await expect(input).toHaveAttribute('type', 'password')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(input).toHaveCSS('font-size', '16px')
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p2/t014-login-375.png', fullPage: true })
  await openNavigation(page)
  await page.getByRole('button', { name: '选择语言', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'English', exact: true }).click()
  await page.getByRole('button', { name: 'Theme', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'Dark', exact: true }).click()
  await page.locator('.nav-content-container .menu-toggle').click()
  await expect(page.getByRole('heading', { name: 'Connect GitHub. Start your image hosting.' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p2/t014-login-375-en-dark.png', fullPage: true })
})
