import { expect, test } from '@playwright/test'

test('登录页能够加载', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#app')).toBeVisible()
  await expect(page).toHaveTitle(/PicX/)
})

test('图片工具箱路由能够加载', async ({ page }) => {
  await page.goto('/#/toolbox')

  await expect(page.locator('#app')).toBeVisible()
  await expect(page).toHaveURL(/#\/toolbox/)
})
