import { expect, openNavigation, test } from './fixtures'

test('登录页提供真实登录操作和未连接导航', async ({ page, picx }) => {
  await picx.open('/?jump=0')

  await expect(page).toHaveURL(/\/images-hosting\/#\/\?jump=0$/)
  await expect(page).toHaveTitle(/PicX/)
  const main = page.getByRole('main')
  await expect(main).toHaveCount(1)
  await expect(main.getByRole('button', { name: '通过 GitHub 授权登录', exact: true })).toBeVisible()
  await expect(main.getByRole('button', { name: '验证并连接', exact: true })).toBeVisible()
  await openNavigation(page)
  const nav = page.getByRole('navigation', { name: '主导航', includeHidden: true })
  await expect(nav.getByRole('link', { name: '上传图片', exact: true, includeHidden: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: '图床管理', exact: true })).toBeHidden()
  await expect(nav.getByRole('link', { name: '图床设置', exact: true })).toBeHidden()
})

test('Token 表单在登录页直接输入且默认掩码', async ({ page, picx }) => {
  await picx.open('/?jump=0')
  const main = page.getByRole('main')
  const tokenInput = main.getByLabel('GitHub Token', { exact: true })
  await expect(tokenInput).toHaveAttribute('type', 'password')
  await expect(tokenInput).toHaveValue('')
  await main.getByRole('button', { name: '验证并连接', exact: true }).click()
  await expect(tokenInput).toBeFocused()
  await expect(main.getByRole('alert')).toHaveText('请输入 GitHub Token。')
  await expect(page).toHaveURL(/#\/\?jump=0$/)
})

test('上传导航进入真实文件选择页', async ({ page, picx }) => {
  await picx.open('/?jump=0')
  await openNavigation(page)
  const nav = page.getByRole('navigation', { name: '主导航', includeHidden: true })
  const upload = nav.getByRole('link', { name: '上传图片', exact: true, includeHidden: true })
  await upload.click()

  await expect(page).toHaveURL(/#\/upload$/)
  await expect(upload).toHaveAttribute('aria-current', 'page')
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { name: '拖拽图片或 MP4 到这里，或直接粘贴图片', exact: true })).toBeVisible()
  await expect(main.locator('input[type="file"]')).toHaveAttribute('accept', 'image/*,video/mp4')
  await expect(main.getByRole('button', { name: '通过 GitHub 授权登录', exact: true })).toHaveCount(0)
})

test('已保存仓库的管理入口呈现目录和直属媒体', async ({ page, picx }) => {
  await picx.open('/upload', { savedRepository: true })
  await openNavigation(page)
  const management = page.getByRole('navigation', { name: '主导航', includeHidden: true }).getByRole('link', { name: '图床管理', exact: true, includeHidden: true })
  await management.click()

  await expect(page).toHaveURL(/#\/management$/)
  await expect(management).toHaveAttribute('aria-current', 'page')
  const main = page.getByRole('main')
  await expect(main.getByText('albums', { exact: true })).toBeVisible()
  await expect(main.getByText('empty', { exact: true })).toBeVisible()
  await expect(main.getByText('coast.png', { exact: true })).toBeVisible()
})

test('管理空目录保持上传恢复入口', async ({ page, picx }) => {
  await picx.open('/management', { savedRepository: true, directoryScenario: 'empty' })

  await expect(page).toHaveURL(/#\/management$/)
  const main = page.getByRole('main')
  const upload = main.locator('.management-content').getByRole('button', { name: '上传到根目录', exact: true })
  await expect(upload).toBeVisible()
  await expect(main.getByText('coast.png', { exact: true })).toHaveCount(0)
  await upload.click()
  await expect(page).toHaveURL(/#\/upload$/)
  await expect(main.locator('input[type="file"]')).toHaveCount(1)
})

test('设置导航进入三个展开分区并回显旧命名', async ({ page, picx }) => {
  await picx.open('/upload', { savedRepository: true })
  await openNavigation(page)
  const settings = page.getByRole('navigation', { name: '主导航', includeHidden: true }).getByRole('link', { name: '图床设置', exact: true, includeHidden: true })
  await settings.click()

  await expect(page).toHaveURL(/#\/settings$/)
  await expect(settings).toHaveAttribute('aria-current', 'page')
  const main = page.getByRole('main')
  for (const name of ['上传处理', '链接与分享', 'GitHub Pages 部署与自定义域名'])
    await expect(main.getByRole('heading', { name, exact: true })).toBeVisible()
  const processing = main.getByRole('region', { name: '上传处理', exact: true })
  await expect(processing.getByRole('button', { name: '保留原名', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(processing.getByRole('button', { name: '原名 + 哈希', exact: true })).toBeVisible()
  await expect(processing.getByRole('button', { name: '时间戳', exact: true })).toBeVisible()
})

test('失效工具箱地址按未知路由回到可操作的登录页', async ({ page, picx }) => {
  await picx.open('/toolbox')

  await expect(page).toHaveURL(/\/images-hosting\/#\/$/)
  await expect(page.getByRole('main').getByRole('button', { name: '验证并连接', exact: true })).toBeVisible()
  await expect(page.getByRole('main').locator('input[type="file"]')).toHaveCount(0)
})
