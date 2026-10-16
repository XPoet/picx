# UI 改造验证数据

T005 建立此目录。数据只用于隔离测试，账户、仓库、SHA、文件名与媒体均为合成样本，基础仓库样本的 Token 为空；不从用户浏览器、环境变量或真实 GitHub 仓库提取数据。

```mermaid
flowchart LR
  Smoke[smoke.spec.ts：现有页面与路由] --> Harness[e2e/fixtures.ts：临时上下文与网络拦截]
  Harness --> Data[ui-redesign.ts：无副作用数据工厂]
  Unit[settings-compat.test.ts：旧设置与云文件边界] --> Data
  Unit --> Current[既有 Store / settings API 纯解析与序列化]
  Harness --> Mock[模拟目录 / 云偏好 / 媒体响应]
  Harness --> Guard[拒绝真实远端访问与未列出的请求]
```

- 仓库 fixture 表示已保存的仓库上下文，`logined: true` 只用于呈现导航，不能证明认证；基础 smoke 不填入认证信息；P2 连接用例显式使用不可用于认证的固定占位字符串，全部交换 / 验证请求均被拦截模拟，不接触真实凭据。
- 目录数据覆盖空目录、仅文件夹、文件夹与直属图片共存，以及含图片 / MP4 的子目录。媒体使用固定小图响应，不下载远程媒体。
- HTTP 失败数据覆盖 401、403、404、409、429 和 503；部分成功数据包含一个 blob 成功、一个 blob 失败，以及 ref 成功 / 失败两种回应。它们供后续 typed request / 逐项上传任务复用，T005 不提前实现结果服务，也不把当前整体布尔值行为固定为正确结果。
- 旧偏好样本缺少 `enableTimestamp`、水印 `rotate / gap`、`management / deploy`，包含原名模式、禁用的旧前缀、编码器、原始 URL 开关、BBCode 选择和自定义链接规则。单测验证现有本地恢复补默认值、UTF-8 云文件解析和云保存仅序列化偏好。
- E2E 使用每个测试独立的 Playwright browser context，阻止 Service Worker 绕过请求拦截；仅放行本地 preview 的 GET / HEAD。GitHub GET 按确定路径返回 fixture，真实外域访问与未知请求一律中止并让测试失败；P2 initialize 场景只在明确路径与阶段返回模拟建仓 / README 结果，重复写入会被拒绝，不访问真实 OAuth、仓库或统计 / IP 服务。
- smoke 与 P2 用例断言实际角色、路由、一次性参数消费和目录弹窗事务，不用 catch-all 页面存在替代目标页验证；尚未进入 P3–P6 的功能不提前判为完成。

运行：先 `pnpm build`，再 `pnpm test:e2e`；单测 `pnpm test`。本机 pnpm 预检 / Chrome 沙箱差异及单次兼容方式见 [P0 验收记录](../../docs/UI-REDESIGN-ACCEPTANCE.md)。这些 fixture 不提供真实认证、远端写入或 Pages 可用性的验收证据。

P1 的 open 参数支持三种语言与三种主题。fixture 使用仅包含固定标记的 window.name 避免刷新重新注入账户，因此登出 / 重载可以验证应用实际清理结果；不会把 Token 或账户写入此标记。登出后默认地区引导的两个精确 GET 目标返回文档保留 IP `203.0.113.1` / `CN`，不发出真实地区查询。安装测试只派发带模拟 prompt 的事件，不执行系统安装。

`directory-selector.html` 是仅在 Vite dev 下使用的受控选择器视觉 fixture，不属于生产路由。访问 `/images-hosting/tests/fixtures/directory-selector.html`，数据完全在内存，选择和展开分开，不调用 GitHub 或存储。用于 T018 的桌面 / 375px 与键盘检查。
