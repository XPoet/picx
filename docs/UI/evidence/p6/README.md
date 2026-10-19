# P6 验收证据

日期：2026-10-19。设计文件只读；`reference/` 为本次通过 Pencil 导出的 11 个画板与上下文组件。`compare-*.png` 左侧为画板、右侧为本轮页面，均按比例缩小到 720px 后并排，原图另存。页面数据是脱敏 fixture，不能证明真实认证、GitHub 写入或视频解码成功。

## T041 · 1440 × 1080 / 简体中文 / 亮色

执行环境：macOS、Node 24.21.0、pnpm 11.17.0、Playwright 配置的已安装 Google Chrome。命令级设置 `verifyDepsBeforeRun=false`，未修改依赖或锁文件。浏览器首次因沙箱退出，获准在沙箱外运行后生成下列证据。

| 步骤 | 画板 / 组件 | 实际证据 | 检查结论 |
| --- | --- | --- | --- |
| 1. 品牌与登录 | `Zo7cz`、`IGX9S`、`DZzo7` | [双侧对照](compare-01-login.png)、[原图](t041-01-login-1440.png) | 本地柔环品牌、字体回退、72px 导航、双等宽卡片、Token 掩码与真实帮助入口符合规范；未登录工具和省略无目标的条款按方案实现 |
| 2. 上下文与空态 | `cOfT3` / `lA2S0`、`O9DRIk` | [对照](compare-02-upload-empty.png) | 内容宽 1264px，侧卡 320px，空态修正为 408px / 24px 圆角；账户、master、路径按真实配置显示；保留公开仓库说明 |
| 3. 仓库目录弹窗 | `Bi2Sk` | [对照](compare-03-directory-0.png) | 760px 弹窗、四模式、草稿预览与固定底部操作；fixture 仅一级目录，列数随真实层级增加 |
| 4. 目录补充状态 | `SLz4l` | [根目录](t041-03-directory-1-1440.png)、[日期](t041-03-directory-2-1440.png)、[非法路径](t041-03-directory-3-1440.png)、[空目录](t041-03-directory-empty-1440.png)、[加载中](t041-03-directory-loading-1440.png)、[加载失败](t041-03-directory-failure-1440.png) | 四种模式及加载、空、失败、重试均有独立反馈；不将说明用组合画板当成单一弹窗尺寸 |
| 5. 待上传队列 | `OL0pP` | [对照](compare-04-queue.png) | 队列修正为 244px，缩略图 48px，移除 44px，详情从缩略图进入；不按画稿复制文件数量；文字和状态自然增高 |
| 6. 已上传 / 已压缩 | `dFSNj` | [对照](compare-05-uploaded.png) | 队列 352px，真实 Worker 产生 JPEG 和体积变化；结果、逐项复制、继续添加与复制全部可达；GitHub 提交为 mock |
| 7. 管理根目录 | `YxFJA` | [对照](compare-06-management-folders.png) | 文件夹、目录工具与独立无媒体状态；内容自适应高度，未固定画板高度 |
| 8. 混合目录 | `EAM8q` | [对照](compare-06-management-mixed.png) | 文件夹 / 直属媒体分区、真实计数和常驻操作；透明 1×1 图片为 fixture，无样例元数据 |
| 9. 目录内选择 | `UUeb5` | [对照](compare-07-management-selected.png) | 面包屑、选择数、半选、批量动作与排序完整；空 MP4 fixture 明确显示预览失败，不冒充成功播放 |
| 10. 设置三分区 | `M0qx2A` | [对照](compare-08-settings.png) | 双卡 620px、间距 24px、分区间距 40px；原名兼容、四编码器、旧规则列表及分步部署反馈增加高度，属于方案要求保留的能力 |

全部页面与对照图已逐一打开检查。修复前后空态、队列与结果重新截图核验。缩略图、数量、目录层级和开关值由 fixture 决定，不按画稿样例报缺陷。暗色、移动和异常补充规则不宣称来自完整设计画板。键盘、读屏、实际设备、Safari、Firefox、真实 GitHub 与 PWA 不由这些截图证明，分别归 T042–T048。

自动化入口：[acceptance-visual.spec.ts](../../../../tests/e2e/acceptance-visual.spec.ts)。仅在 `PICX_CAPTURE_TASK=T041` 且 `desktop-chrome` 项目运行时写入本任务截图，常规回归不覆盖证据。
