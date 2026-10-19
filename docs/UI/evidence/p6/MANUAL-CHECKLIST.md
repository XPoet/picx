# Chrome 手工补充验收

2026-10-19：Chrome 控制连接中断，用户报告两次无响应后改为用户手工操作。代理暂停 Chrome 控制，通过 GitHub 只读 API 核对后续结果。Safari / Firefox 已由用户排除。

已确认的 9 个测试文件、重命名、移动和 Pages 部署均已保存在远端；不需要重传专用目录的旧文件。根 / 日期目录各一次上传已获明确授权；保留测试文件和 CNAME。

若 Chrome 仍无响应，可用 macOS 的 ⌘⌥Esc 选择 Chrome 强制退出后重开；未提交的网页输入可能丢失。保留网站数据和 GitHub 登录，暂不重新连接浏览器控制扩展。

1. 打开 `http://localhost:4000/images-hosting/#/upload`，确认仓库是 `XPoet/picx-images-hosting`、分支 `master`、状态“GitHub 已连接”。
2. 点击“更改上传目录” → “根目录” → “保存目录”，确认显示 `/`。
3. 若队列已有 `p6-acceptance-root` 开头的待上传项，直接等待处理完成；否则选择图片，在 macOS 文件框按 ⌘⇧G，输入 `/private/tmp/picx-p6-media/p6-acceptance-root.png` 并打开。确认仅有 1 个待上传文件，点击“上传 1 个文件”；等待成功 1、失败 0、实际目录 `/`。
4. 更改上传目录 → “日期目录” → “保存目录”，确认显示 `/20261019`。
5. 选择 `/private/tmp/picx-p6-media/p6-acceptance-date.png`，等待处理完成，点击“上传 1 个文件”；等待成功 1、失败 0、实际目录 `/20261019`。
6. 回报两项成功 / 失败和页面提示即可。代理随后核对 GitHub 实际路径、字节数与提交；无需发送 Token、OAuth code 或浏览器日志。

根 / 日期上传完成后，仓库目录模式仍需通过现有专用目录选择器补充真实上传；未操作前保持待验。读取或清理 CNAME、删除测试文件均不属于手工步骤。
