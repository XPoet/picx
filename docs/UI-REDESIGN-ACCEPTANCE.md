# PicX · UI 改造验收记录

记录日期：2026-10-16。任务依据：[执行清单](UI-REDESIGN-TASKS.md)；产品与契约依据：[改造方案](UI-REDESIGN-SPEC.md)。完成状态只在执行清单中勾选。本记录分别说明源码核对、自动检查、页面证据和真实远端结果，不互相替代。

## P0 基线与契约

### T001 核对设计画板与存量功能

**实施提交**：`18b144f`，`docs(ui): inventory redesign boards and existing capabilities`。

**初始工作区**：`develop`，HEAD `74b795e`，相对 `origin/develop` 领先 3 个提交；`git status --short --branch` 无已修改、暂存或未跟踪文件。既有布局提交 `517885e` 和仓库名称提交 `20b28b9` 已提交，本轮不重置或混入这些改动。方案中“已有未提交改动”是编写时的历史状态。

**设计证据**：通过 Pencil MCP 的 `Get`、`GetVariables`、`TakeScreenshot` 只读核对 [设计文件](UI/picx-ih.pen)。逐一读取下表全部节点文字并查看截图，另核对复用组件 `lA2S0` 与顶层实例 `cOfT3`；未修改设计文件。主要业务画板宽 1440px，登录、上传及管理画板高 1080px；设计系统、目录状态和长设置页按内容高度处理。

| 画板 ID | 覆盖内容 | 后续实现落点 |
| --- | --- | --- |
| `Zo7cz` | 品牌、亮色色板、字号与字体 | T006–T007；深底品牌示例不等于完整暗色业务稿 |
| `DZzo7` | OAuth / Token 双卡片、浏览器凭据提醒、页脚 | T008–T014；隐私与条款无正式目标时不展示 |
| `O9DRIk` | 仓库上下文、上传空态、快捷设置、Pages | T016、T020、T023–T024、T038–T040 |
| `Bi2Sk` | 仓库目录、选择与展开、预览和保存 / 取消 | T017–T019 |
| `SLz4l` | 根 / 日期 / 仓库 / 新建四模式、5 层校验、加载 / 空 / 失败 | T017–T019 |
| `OL0pP` | 待上传队列、继续添加、数量和体积 | T020–T022、T025 |
| `dFSNj` | 成功队列、压缩前后大小、复制与管理入口 | T026–T028 |
| `YxFJA` | 根目录仅文件夹、上传到根目录 | T029–T030 |
| `EAM8q` | 文件夹与直属图片分区 | T029–T031 |
| `UUeb5` | 目录内媒体、搜索、选择与批量动作 | T029–T033 |
| `M0qx2A` | 上传处理、链接分享、部署域名三个设置区 | T034–T040 |
| `lA2S0` / `cOfT3` | owner / repo、branch、上传路径、连接状态 | T016；只接收无凭据展示模型 |

画稿中的账户 `XPoet`、分支 `main`、日期、目录、文件、数量、尺寸和体积均为示例。初始化常量仍是 `master`；真实仓库、日期、权限、媒体元数据和连接状态必须来自实际结果。文件选择范围是图片与 MP4，不能按画稿泛称为所有视频格式。

**职责与入口盘点**：原“图床配置”负责连接、初始化和上传目录；原“图床设置”负责长期偏好。配置页后续并入登录与上传，`/settings` 保留，P0 不提前切换路由。

| 现存能力 / 当前入口 | 源码调用链 | 新入口或保留方式 |
| --- | --- | --- |
| OAuth 登录、安装和教程：`/` | `picx-login.vue` → `picx-login.util.ts` → `api/user.ts` / `api/repo.ts` → 认证 Store | 登录卡片；回调初始化后进入上传，T012–T015 |
| 手动 Token、一键初始化：`/config?focus=1` / `?auto=1` | `picx-config.vue` → `picx-config.util.ts` → 用户 / 仓库 / 目录 API → `PICX_IH_CONFIG` / `AUTHORIZATION` | Token 表单移登录；初始化提为业务逻辑；旧链接兼容，T013–T015 |
| 根、日期、仓库、新建上传目录：`/config` | `repo-dir-cascader.vue` / 配置页 → `getDirInfoList` → `SET_USER_CONFIG_INFO` / 持久化 | 上传页两处按钮打开同一草稿弹窗，T016–T019 |
| 多次文件选择、拖放、图片粘贴、MP4：`/upload` | `getting-images.vue` → 文件工具 → `upload-image.util.ts` → 上传队列 | 持续追加入口，保留文件类型与大小限制，T020–T021 |
| 单文件重命名、哈希、前缀与预览 | `upload-image-card.vue` / `.util.ts` → `UploadImageModel.filename` | 队列项显式“更多 / 详情”，移动端同样可用，T022、T025 |
| 单张 / 多张上传、复制与已上传数量 | `upload-image.vue` → `upload-utils.ts` → contents / blob / tree / commit / ref API → 管理缓存 | 逐项结果与成功项复制；快捷键共用操作门禁，T026–T028 |
| 压缩与编码器选择 | 设置页 / `compress-config-box.vue` → `compress-image.ts` → `services/image-codec.ts` → Worker | 设置页保留高级编码器；上传快捷开关共享偏好，T021、T024、T035 |
| 水印四角 / 平铺、角度、间距 | `watermark-config-box.vue` → `add-watermark.ts` → 文件处理 | 设置页完整配置、上传快捷开关；保留水印后压缩顺序，T021、T024、T035 |
| 文件夹进入、返回上级、排序、刷新 | `/management` → `imgs-management.vue` / `tools-bar.vue` → 目录 API / 缓存 / `use-image-upload-time` | 面包屑、当前目录过滤、分区、保留原排序，T029–T031 |
| 图片 / MP4 预览、属性、复制、重命名、移动、删除 | 管理卡片 / selector / 右键指令 → `image-card.util.ts` / `repo-content-utils.ts` → GitHub API → 缓存 | 卡片常驻动作与更多菜单；右键作为附加入口，T031–T033 |
| 目录重命名、递归删除、媒体移动 | `folder-card.util.ts` / 移动弹窗 → `repo-content-utils.ts` → tree / commit / ref → Store | 文件夹更多菜单与明确确认；保留递归影响说明，T029、T033 |
| 原名 / 哈希 / 时间戳 / 前缀 | `/settings` → `UserSettingsModel.imageName` → 上传对象生成 | 三种命名选项映射旧字段；原名兼容、时间戳互斥，T022、T035 |
| 来源、预设 / 自定义规则、裸 URL / Markdown / HTML / BBCode | 设置页 / `image-link-rule-config.vue` → `image-link-utils.ts` → 本地与云设置 | 设置页“链接与分享”；上传页格式同步，T023–T024、T036 |
| Pages、域名、`.deploy` / CNAME | 部署条 / 设置页 → `deploy-status-bar.util.ts` → `api/branch.ts` / `api/deploy.ts` | 两页共用部署阶段；CNAME 与重建分支显式操作，T038–T040 |
| `.settings` 偏好同步 | `app-wrap.vue` → 单实例 `use-cloud-settings-sync.ts` → `api/settings.ts` | 保留单实例与旧云文件；增加同步反馈，T037 |
| 简 / 繁 / 英、页面标题和组件语言 | 侧栏语言入口 → `GLOBAL_SETTINGS` → `app-wrap.vue` → i18n / Element Plus / 更新提示 | 顶栏入口；三处 locale 同步验证，T009、T042 |
| 明 / 暗 / 系统主题 | 设置 / 布局工具 → 全局设置 → `set-theme-mode.ts` / `theme.styl` | 顶栏；系统变化监听列入后续验收，T006、T009、T042 |
| PWA 安装、更新、WASM 与图片运行时缓存 | `plugins/vite/pwa.ts` / 更新通知插件 / `image-cache-utils.ts`；源码未见自定义安装事件入口 | 账户工具中按条件显示安装；保留缓存与更新能力，T009、T047 |
| 反馈、公告、仓库 / 帮助入口 | `/feedback`、`site-announcement`、导航与头像 | 页脚 / 帮助 / 账户工具；不添加虚假目标，T009–T010 |

上表 Vue 文件均位于 `src/views/` 或 `src/components/` 对应同名目录，API 位于 `src/common/api/`；[方案 §10](UI-REDESIGN-SPEC.md#10-组件业务与数据边界) 给出完整模块边界。调用方向保持 View → composable / service → API → request，Store 保存已提交配置与共享运行态；通用工具不新增对 View 的依赖。

**已知问题及后续归属**（源码核对，页面复现和工程运行另见 T004）：

| 问题 | 依据 | 处理任务 |
| --- | --- | --- |
| `/login` 未注册，靠 catch-all 回登录；`/toolbox` 未注册但 smoke 仍断言它 | `router/index.ts`、两个头像、`picx-login.util.ts`、`tests/e2e/smoke.spec.ts` | T015 修复跳转；T005 修复 smoke |
| 目录直接写 Store；新建路径在持久化中静默改写 / 截断 | `repo-dir-cascader.vue`、`stores/picx-store.ts` 的 `normalizeUserConfigInfo` | T017–T019 |
| 空目录与请求失败都变成 `[]`，刷新先清旧管理缓存 | `api/dir.ts`、`imgs-management.vue` | T012、T018、T033 |
| 小屏不挂载队列卡片，处理却由卡片挂载触发 | `upload-image.vue`、`upload-image-card.vue` | T021 |
| 批量 blob 部分失败仍可能返回 true，成功项 size 写 0 | `utils/upload-utils.ts` | T026 |
| 上传监听未卸载、快捷键未排除编辑区域 | `upload-image.vue`、`deploy-status-bar.vue` | T028 |
| 部署以 50 秒计时器判成功，随后切换链接来源；运行锁分散 | `api/branch.ts`、`deploy-status-bar.util.ts`、部署组件 | T038 |
| Token 输入绑定已保存配置，失败日志可能包含请求对象；存在 HTML 通知 | 配置页、初始化 catch、request 与授权提示 | T003 明确边界；T012–T014 迁移时收口 |
| 根字号小屏继续缩小、多层滚动与小触摸目标 | `styles/base.styl`、页面 Stylus | T006、T011 |
| 无手机、完整暗色、部分成功等画稿；部分旧能力没画出 | Pencil 全量核对、源码能力表 | 按方案补充状态与兼容入口，T041–T044 |

**验证结果**：方案 §2、§13 与上述 11 个画板、复用组件及源码入口逐项对应；文档相对文件链接与 `git diff --check` 通过。此任务没有运行应用测试或真实 GitHub 操作。

**遗留与回滚**：上述业务问题均有后续任务归属，不视作本项已修复。回滚本项提交只影响任务清单与验收文档，不改用户配置、应用代码或设计稿。

### T002 固化内部状态、类型和结果契约

**实施提交**：`d2f96fd`，`docs(ui): specify runtime state and operation result contracts`。

**产出与证据**：[方案 §10.5–10.10](UI-REDESIGN-SPEC.md#105-类型化请求与连接状态t002) 固定类型化错误、连接状态、目录草稿 / 受控选择器、目录保存事务、处理代次、上传目标快照、逐项结果、部署阶段和设置同步状态。每个类型给出唯一业务归属、状态转换与旧调用方适配方式；模块方向沿用 §10.1。

**反例验证**：逐项核对取消目录、6 层路径、合法空目录与 403、保存抛错、blob 部分失败、ref 失败、跨午夜、晚到处理结果、Pages 未可用、云设置损坏及旧修订完成。约束结论均记录于方案 §10.10。成功项以 ref / contents 的真实提交成功为界，不因 blob 已生成即显示成功；未知 Pages 状态不视为可用。

**兼容检查**：新增状态与目录草稿只在内存；沿用原存储键、目录三字段、命名字段、`UploadImageModel` 和 `.settings` 结构；不增加凭据副本或命名模式。API 只返回数据，服务 / composable 编排，Store 完成事务，View 只组织展示。未迁移请求和目录选择器保留兼容入口，新的类型化调用不能退化为失败空数组。

**检查结果**：文档相对文件链接、完成数 2/48 和 `git diff --check` 通过；本项不改应用代码，不声称这些契约已经实现。T012–T040 按任务范围落地并新增行为测试。回滚本项只撤回文档契约，不影响运行时或用户配置。

### T003 明确认证、设置与目录的存储安全边界

**实施提交**：`15450d4`，`docs(ui): define credential and settings storage boundaries`。

**产出与证据**：[方案 §5.3](UI-REDESIGN-SPEC.md#53-认证调用链与源码安全审计t003) 记录 Token 校验、OAuth 回调、请求鉴权、重连、登出与云同步的真实调用链；[§10.11](UI-REDESIGN-SPEC.md#1011-存储允许字段期限与清理时机t003) 列出五个既有存储键、云文件、组件 / 运行内存和 PWA 缓存的允许字段、期限、禁止项与清理时机。

**安全核对结果**：现有 Token 表单是共享配置引用；显式验证头会受旧 Token 拦截器覆盖；OAuth code 进入已有持久化且失败收尾不足；登出 storage.clear 没有重置内存授权；原始错误对象与 HTML 通知存在暴露面；云设置读取失败 / 损坏仍可能触发播种。这些是源码发现的既有问题，已分别指定 T012–T015、T021、T028、T037–T039 负责收口，P0 不宣称已修复。

**兼容与验证**：旧保存键、长期 / 会话期限和偏好字段保持兼容；新 Token 草稿验证后才提交，目录取消不持久化，上下文只接收无凭据模型，`.settings` 只允许偏好。人工逐项追踪正常、失败、重连和登出分支，未读取任何真实 Token、OAuth code、环境变量值或用户浏览器数据；未运行真实授权。文档相对文件链接、3/48 状态与 `git diff --check` 通过。

**遗留与回滚**：动态安全用例在对应实现任务补充，T005 只建立无凭据 fixture 和网络隔离。回滚本项只撤销安全设计文档，不改现有凭据或用户存储。

### T004 执行并记录当前工程与页面基线

**实施提交**：`8b0a925`，`docs(ui): record engineering and page baselines`。应用源码基于 `15450d4`，P0 前三项只有文档变化。

**环境与约束**：macOS 14.5 / arm64，Node `v24.21.0`；仓库要求 Node `>=24 <25`，`.node-version` / `.nvmrc` 均为 24。初始 PATH 中 pnpm 为 `11.17.0`，随后以 `COREPACK_HOME=/private/tmp/picx-ui-p0-corepack corepack pnpm --version` 获取并确认仓库声明的 `11.18.0`，最终基线使用该版本。未重装项目依赖或改锁文件。

锁文件 `pnpm-lock.yaml` 格式 9.0，importer 锁定 Vue 3.5.40、Pinia 4.0.2、Vue Router 5.2.0、Element Plus 2.14.3、Vue I18n 11.4.8、Vite 8.2.0、TypeScript 6.0.3、Vitest 4.1.10、Playwright 1.62.1。这些是锁定版本；不读取安装目录来宣称安装完整性。运行输出实际报告 Vite 8.2.0、Vitest 4.1.10、PWA 插件 1.3.0。

`package.json` 已有 `lint / lint:style / typecheck / test / build / test:e2e / verify`，`verify` 串行包含前五项；ESLint 与 app tsconfig 明确排除历史 Vuex 模块实现，运行主 Store 是 Pinia。CI 读取 `.nvmrc`、由 packageManager 配置 pnpm、执行 frozen-lockfile 安装与 verify；没有执行远端 CI，本地通过不代表远端通过。AGENTS 中 Vuex / 无测试脚本的描述不再作为当前工程事实。

**本机隔离办法**：直接 `pnpm verify` 和首次提交 hook 退出 1，原因是 `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN`，提示 `enableGlobalVirtualStore` 与已有安装记录不同。未读取 `node_modules` 安装记录、未运行 install。仅在临时命令包装器 `/private/tmp/picx-ui-p0-bin/pnpm` 给 Corepack 的 pnpm 加 `--config.verifyDepsBeforeRun=false`，再将该目录前置到本次命令 PATH，使 verify 内部子命令、preview 和 Git hooks 使用同一参数与 pnpm 11.18.0；仓库配置保持原样。此参数绕开安装状态预检，不替代依赖完整性证明。Git hooks 的 lint-staged / commitlint 仍实际执行。

| 检查 / 命令 | 退出与结果 | 归属 / 处理 |
| --- | --- | --- |
| 原始 `pnpm verify` | 1；依赖状态预检失败，未进入 lint | 本机环境差异；用上述单次参数隔离 |
| `PATH=/private/tmp/picx-ui-p0-bin:$PATH pnpm verify` | 0；ESLint、Stylelint、app + Worker 类型检查、2 文件 / 11 单测、生产构建均通过 | 最终使用 pnpm 11.18.0；原始运行日志 `/private/tmp/picx-ui-p0-verify.log`，本表保留持久摘要 |
| 构建附带 PWA 生成 | 通过；生成 SW，预缓存 60 项 | 只记录构建结果，不代表安装、离线或升级验收 |
| 构建后 `pnpm test:e2e`（同一 PATH，初次在沙箱内） | 1；4 项均在 Chrome 启动前 SIGABRT / EPERM | 主机执行限制；独立临时 Chrome 上下文在获准沙箱外重跑 |
| 相同 E2E 命令在可启动浏览器环境重跑 | 1；桌面 / 手机登录各通过；桌面 / 手机 `/toolbox` 各失败，合计 2 通过、2 失败 | 旧测试断言未注册路由，交 T005；不能归因为新 UI 或认证失败 |
| `git diff --check`、文档链接 / 4/48 状态 | 0，通过 | 本项文档及证据检查 |
| format、真实 OAuth / Token、远端写入、Safari / Firefox、完整 PWA | 未执行 | 不属本项；按后续任务授权与范围验证 |

E2E 原配置为 Desktop Chrome 和 Pixel 5，`channel: chrome`，preview 地址 `http://127.0.0.1:4173`，实际应用 base 是 `/images-hosting/`。Chrome 实际版本 `155.0.8059.82`。终端的 NO_COLOR / FORCE_COLOR 警告不影响退出结果。

**页面复现证据**：[页面与路由记录](UI/evidence/p0/page-baseline.json)，简体中文、亮色、1440×1080 与 375×1080；Pencil 对照节点沿用 T001 表。独立浏览器只注入 owner=`fixture-owner`、branch=`master` 的合成上下文，Token 为空；`.settings` 用 `{}` 模拟已有文件，`.deploy` 用 404；外域请求和远端写入被阻断，Service Worker 在该上下文禁用。`logined: true` 仅用于呈现已有导航 / 仓库上下文，不证明已验证认证。

| 页面 | 桌面证据 | 375px 证据 | 基线结论 |
| --- | --- | --- | --- |
| 登录 | [1440](UI/evidence/p0/login-1440.png) | [375](UI/evidence/p0/login-375.png) | 两种登录按钮存在；Token 按钮仍转配置页，P2 再迁移 |
| 图床配置 | [1440](UI/evidence/p0/config-1440.png) | [375](UI/evidence/p0/config-375.png) | 当前仍是独立页，focus 入口可到达空 Token 输入 |
| 上传 | [1440](UI/evidence/p0/upload-1440.png) | [375](UI/evidence/p0/upload-375.png) | 文件选择和目标目录可呈现；尚无新快捷设置与结果区 |
| 图片管理 | [1440](UI/evidence/p0/management-1440.png) | [375](UI/evidence/p0/management-375.png) | 旧文件夹卡片可呈现，尚无面包屑与搜索 |
| 图床设置 | [1440](UI/evidence/p0/settings-1440.png) | [375](UI/evidence/p0/settings-375.png) | 原有七个折叠设置区存在；尚未拆为三个分区 |

这些页面均有唯一 `main`，所采样初始状态未发现页面级横向溢出；这不代表长内容、输入字号、触摸目标、键盘和所有内部滚动已验收。人工查看桌面登录 / 管理及手机登录 / 上传 / 设置截图，记录现有侧栏、卡片与折叠设置形态，不将其标为新画稿视觉通过。

旧链路复现：`#/toolbox → #/`，`#/login?jump=0 → #/?jump=0`（依赖 catch-all），Token 登录按钮 → `#/config?focus=1`。前者是失效 smoke 的直接原因；后两者留待 T015 的完整迁移。

**遗留与回滚**：阻塞 smoke 的旧断言由 T005 修复；pnpm 预检和 Chrome 沙箱问题已有明确本机隔离命令，不改项目或用户设置。回滚本项只影响任务 / 基线文档与新增证据，不改应用代码、配置、存储或远端资源。

### T005 修正失效 smoke 并建立 UI 验证 fixture

**实施提交**：`test(ui): replace stale smoke and add isolated redesign fixtures`（本节所属提交，可按标题定位）。

**产出**：[数据与模块边界说明](../tests/fixtures/README.md)、[数据工厂](../tests/fixtures/ui-redesign.ts)、[隔离浏览器 / 请求 fixture](../tests/e2e/fixtures.ts)、[smoke](../tests/e2e/smoke.spec.ts)、[设置兼容单测](../tests/unit/settings-compat.test.ts)。不新增依赖、不改应用源码、存储格式、运行时功能或设计稿。

smoke 每个平台 7 项：两种登录操作与未连接导航；Token 转当前配置页并聚焦空掩码输入；上传导航、文件选择与 MP4 accept；管理导航、目录与直属媒体；空目录上传恢复；设置导航与可展开命名偏好；失效工具箱地址按未知路由回到可操作登录页。每项检查真实 URL 和对应页面角色 / 操作，上传断言不能由登录回退页满足。

fixture 覆盖合成仓库、空 / 仅文件夹 / 混合目录、图片与 MP4、HTTP 401 / 403 / 404 / 409 / 429 / 503、blob 部分失败、ref 成功 / 失败，以及缺少新字段的旧偏好。失败和部分成功数据为 T012 / T026 准备，不提前实现新结果模型，也不把当前已知整体布尔值行为当作正确契约。

所有 E2E 使用独立临时上下文，Token 为空、不填 OAuth code、不加载认证存储；禁用 Service Worker，网络只放行本地 preview 读请求和明确路径的模拟响应。外域写入与未知请求会被中止并在 teardown 断言失败。根目录明确兼容旧 API 的 `contents//`；不放宽为任意路径。`.settings` 返回已有的模拟偏好，避免启动自动播种；图片来自内置 1px PNG，不下载远程媒体。

新增 4 个单测验证旧本地偏好的缺省补齐与无损保存、含中文水印的旧云文件解析、损坏文件返回 null，以及云保存只序列化偏好、没有仓库 / 凭据字段。最后一项 mock 请求，不产生真实远端 PUT。这些检查不代表新安全契约、完整结构校验或新版云同步逻辑已经实现。

| 最终检查 | 实际结果 |
| --- | --- |
| `PATH=/private/tmp/picx-ui-p0-bin:$PATH pnpm verify` | 退出 0；lint、stylelint、app / Worker 类型检查、3 文件 / 15 单测、build 通过 |
| 构建后相同 PATH 的 `pnpm test:e2e --workers=2` | 退出 0；Desktop Chrome 7 项、Pixel 5 7 项，共 14 项通过；无未知 / 真实写入请求 |
| 原 `/toolbox` smoke 失败 | 已消除；由真实图床页面断言与明确的未知路由回退检查替代 |
| 文档相对文件链接、5/48 状态、`git diff --check` | 通过；没有将后续任务提前勾选 |

最终运行沿用 T004 的 Node 24.21.0、Corepack pnpm 11.18.0、单次 `verifyDepsBeforeRun=false` 参数；Chrome 在获准沙箱外启动临时上下文。verify 的原始日志保存在 `/private/tmp/picx-ui-p0-final-verify.log`，本表保留持久摘要。没有执行真实认证、创建仓库、上传、删除、部署、CNAME、推送或远端 CI。

**P0 准出结论**：T001–T005 的盘点、类型 / 状态 / 安全契约与可复现检查基线已交付；旧 smoke 阻塞已修复，本机执行限制已有隔离办法。目录草稿、逐项结果、部署真实性、认证清理和云同步缺口仍按 T012–T040 逐项实现，不能将 P0 完成解释为 UI / 业务改造已完成。P1–P6 保持未开始。

**回滚**：本项提交只涉及测试、fixture 和文档；回滚不会改用户配置、凭据或远端文件。P0 各提交可独立回滚，实际删除新增文件仍须遵守仓库的删除授权规则。

## P1 设计系统与公共布局

2026-10-16 开始，起点 `a7c62bd`，工作区干净，分支 `develop`。组件边界为 `AppWrap → MainContainer → HeaderContent（NavContent / 账户工具）+ RouterView + SiteFooter`；主题通过 CSS Token 供公共组件与 Element Plus 共用。保留旧业务路由、Store、存储键，不修改设计稿、不删除文件、不推送。

### T006 建立语义 Token 与 Element Plus 主题桥接

**实施提交**：`feat(ui): establish semantic theme tokens and Element Plus bridge`（本节所属提交）。

集中定义设计稿 `Zo7cz` 的品牌、操作、文本、背景、边框、状态和焦点色；补齐暗色、尺寸、间距、圆角和层级 Token。历史 `--background-color` 等变量映射到新 Token；Element Plus 表单、按钮、禁用、错误和浮层共用主题。根字号换算保持原样，正文采用 14px，手机输入 16px，按钮至少 44px；提供通用焦点和减少动态效果规则。暗色桥接使用明确选择器优先级，避免组件库暗色变量覆盖。

**验证**：`pnpm lint`、`pnpm lint:style`、`pnpm build`、`git diff --check` 通过。沿用 P0 的临时命令包装方式，本次路径为 `/private/tmp/picx-ui-p1-bin/pnpm`，Corepack pnpm 11.18.0 / Node 24.21.0，单次 `verifyDepsBeforeRun=false`，未安装依赖或分析禁止目录。纯主题未增加业务单测。

Chrome、简体中文、1440×1080 / 375×812 检查了配置输入、按钮、公告弹窗和管理页图片预览；凭据为空，远端请求全部使用模拟响应或阻断。证据：[亮色](UI/evidence/p1/t006-light.png)、[暗色](UI/evidence/p1/t006-dark.png)、[手机弹窗](UI/evidence/p1/t006-dialog-375.png)、[图片预览](UI/evidence/p1/t006-preview.png)。浏览器确认桌面根字号 1px、正文 14px、手机输入 16px，暗色表单背景为语义 surface。

WCAG 对比度计算：亮 / 暗正文 13.03 / 12.13，辅助文本对页面背景 5.47 / 9.04，主按钮 5.38 / 7.13，Hover 6.51 / 9.19，错误 5.59 / 6.85，控件边界 3.25 / 4.84，焦点 4.31 / 8.40。旧业务细节的逐页视觉验收仍归 P2–P6。

**回滚**：回滚本任务样式与记录提交即可恢复旧主题；不改用户配置或业务数据。

### T007 接入品牌、字体回退和统一图标资源

**实施提交**：`feat(ui): add original brand vectors and local Lucide icons`（本节所属提交）。

从画稿 `IGX9S` / `D4Rf6` / `trNzM` 提取精确矢量，保留柔环渐变与 Manrope Bold 转曲字标；新增 BrandLogo 与类型化 PicxIcon。20 个本地 Lucide symbol 共 4060 字节，统一 24px viewBox、2px 描边、currentColor；默认装饰语义，独立含义图标可通过 label 获得可访问名称。公告先使用本地 bell，其他公共入口在 T008–T010 接入。资源来源与许可见 `src/assets/brand/SOURCE.md`、`src/assets/icons/SOURCE.md`，保留 Lucide ISC / Feather MIT 与 Manrope OFL 声明。无新增依赖或字体文件。

**验证**：lint、stylelint、typecheck、build、diff 检查通过。独立 Chrome 上下文禁用 Service Worker，1440×1080 简体中文、亮暗主题与 200% 缩放检查原稿字标：[亮色](UI/evidence/p1/t007-brand-light.png)、[暗色](UI/evidence/p1/t007-brand-dark.png)、[缩放](UI/evidence/p1/t007-brand-zoom.png)。实际网络无外域 / 字体请求；SVG 使用 no-inline 本地 URL，避免 data URL 外部 use 无法渲染。未读取字体或依赖安装目录，系统回退以浏览器实际 font-family 列表为准。

**回滚**：回滚本任务提交恢复原品牌入口与字体；不改变登录、存储或业务路由。新增公共组件后由构建插件自动更新 components.d.ts。

### T008 实现胶囊顶栏与导航

**实施提交**：`feat(ui): introduce capsule header and keyboard accessible navigation`（本节所属提交）。

HeaderContent 组合品牌、NavContent 和原账户工具；MainContainer 移出侧栏。真实 RouterLink 使用路径激活态与 aria-current，品牌 / 首页进入 `/?jump=0`，旧 `/config` 入口与管理校验保留至 T015。未连接时管理 / 设置沿用原有可见性规则；不声称 P2 的无连接业务页面已完成。

窄于 1280px 使用展开导航，支持 Tab / Enter、首链接聚焦、Esc、外部点击、导航后关闭和焦点返回；媒体查询与文档事件均清理。菜单包含现有工具，语言 / 主题 / 账户在 T009 整合。修正历史上传区选择层高于新菜单的问题，顶栏层级 2000、菜单 2100、模态层 3000。

**验证**：lint、stylelint、typecheck、build、diff 检查通过；构建后 `pnpm test:e2e --workers=2` 18 项通过（桌面 9、手机 9）。新增测试覆盖品牌引导、浏览器返回、真实激活态和 375px 键盘菜单；原业务 smoke 适配展开菜单，不绕过点击。初次失败已修复：动态按钮名称导致测试定位失效、上传透明 label 拦截指针。

Chrome、独立无 SW 上下文、亮色英文：[1440×1080](UI/evidence/p1/t008-header-1440-en.png)、[375×812 展开](UI/evidence/p1/t008-menu-375-en.png)。顶栏实测 x=32、y=24、宽 1376、高 72px；手机无页面横向溢出。暂留配置导航导致菜单比最终稿多一项，T015 在能力迁移后取消。

**回滚**：回滚本任务布局 / 导航 / 测试提交即可恢复侧栏，不改变业务存储或路由协议。

### T009 整合账户、语言、主题、通知和安装工具

**实施提交**：`feat(ui): integrate account preferences announcements and install tools`（本节所属提交）。

HeaderTools 使用现有全局设置与公告，匿名展示开始使用，已登录使用账户实际 owner / avatar；无样例身份、无假连接标记。HeaderMenu 提供语义菜单、方向键、Home / End、Esc、外部点击和焦点返回。重连 / 登出进入真实 `/` 登录页；先在方案 §3.1 定义 returnTo 站内白名单，再实现恢复目标保留。完整连接后的消费归 T015。

AppWrap 单次初始化主题，跟随系统变化，监听随作用域释放；移除 MainContainer 的重复初始化。语言同步 i18n、HTML lang、Element Plus、页面标题和更新通知；界面偏好只写现有 session 设置。地区提示改用 Vue 文本节点与按钮，不再拼接 HTML；本地 Element Plus 类型声明补齐真实支持的 VNode。公告使用可聚焦模态弹窗。安装只在 beforeinstallprompt 到达后提供，处理完成 / 取消 / 失败并清理监听；没有修改 SW、manifest 或缓存策略。

**验证**：lint、stylelint、typecheck、build、diff 检查通过；构建后 E2E 32 项通过（桌面 / 手机各 16）。覆盖三语切换后的 Element Plus 关闭名称、标题与真实更新插件 setLocale；亮 / 暗 / 系统模式与系统变化；账户菜单键盘、重连、登出后的存储清理 / 匿名入口 / 首次公告；模拟可安装事件。源码确认 setThemeMode 只有一个初始化入口，安装监听各注册 / 清理一次。安装测试不代表真实系统安装或完整 PWA 验收，后者归 T047。

Chrome、无 SW 独立上下文、无凭据 fixture：[1440 简中暗色账户](UI/evidence/p1/t009-account-dark-1440.png)、[1440 英文账户](UI/evidence/p1/t009-account-en-1440.png)、[375 繁中工具](UI/evidence/p1/t009-tools-tw-375.png)。没有未知请求或远端写入；长英文导航允许换行，临时配置项由 T015 移除。fixture 修正为重载不重新播种账户，地区查询仅返回合成 IP / 国家。

**回滚**：回滚本任务公共工具、初始化和类型补充提交，恢复原工具入口；不新增凭据副本或偏好存储键。

### T010 实现页脚与帮助反馈入口

**实施提交**：`feat(ui): add responsive footer and reachable feedback links`（本节所属提交）。

新增 SiteFooter，提供原稿 `DZzo7` 的品牌说明、真实帮助文档与 `/feedback`。没有隐私 / 条款占位链接。反馈页沿用原内容与目标，移除结构性 Emoji，使用统一图标、标题与可换行链接；补充 package.json 现有 issues 目标作为反馈操作，不创建无关页面。三语同步，链接目标至少 44px，外链带 noopener noreferrer。

**验证**：lint、stylelint、build、diff 检查通过；E2E 34 项通过，新增页脚键盘 Tab / Enter、真实 URL、反馈标题与 issues 链接断言。通过网页读取确认已有 [帮助文档](https://picx-docs.xpoet.cn/) 与 [Issues](https://github.com/XPoet/picx/issues) 目标可达；未提交反馈或外部写入。Chrome、亮色英文：[1440](UI/evidence/p1/t010-feedback-1440.png)、[375](UI/evidence/p1/t010-feedback-375.png)，无页面横向溢出。页脚处于正常布局，不覆盖内容；当前长内容仍使用旧内部滚动，T011 统一页面滚动。

**回滚**：回滚页脚、反馈样式与翻译提交，保留原 `/feedback` 页面和业务能力。

### T011 调整主容器、滚动与公共响应式

**实施提交**：`feat(ui): unify document scrolling and responsive shell layouts`（本节所属提交）。

根容器采用 min-height 与文档主滚动，移除页面、管理列表和上传操作区的固定高度 / 多层滚动；主内容居中，最大 1264px，桌面 / 平板 / 手机分别使用 32 / 24 / 16px 基础边距。根字号换算保持原样；App 字体继承品牌回退表。上传队列在手机正常显示，保留自身限高滚动与键盘焦点，使用稳定 uuid；目录和操作区可换行。设置长文本、单列表单和压缩选项说明不再被裁切；手机选择控件实测至少 44px。弹窗采用视口内限高、正文滚动和固定可见头尾；原请求、处理算法和存储契约保持不变。

**工程检查**：同一临时 pnpm 包装环境执行 `pnpm verify` 退出 0，ESLint、Stylelint、app / Worker 类型检查、3 文件 / 15 单测、生产 build 均通过。构建后的 `pnpm test:e2e --workers=2` 退出 0，40 项通过（桌面 / 手机各 20）。PWA 构建生成成功，只代表生成检查。`git diff --check`、三语 key 和任务复选框计数通过。

新增验证覆盖全部设置展开后五档宽度与 1024×400 的页尾可达、375px 八文件队列与键盘滚动、低高度公告弹窗、图片预览覆盖顶栏、控件最小高度与压缩长说明。首次队列断言在浏览器滚动更新前读取 scrollTop，改用 expect.poll 等待实际完成后通过；没有增加产品定时器或改变滚动行为。截图进一步发现的旧长说明裁切与小选择控件已修复并完整复验。

**视觉证据**：Chrome 155.0.8059.82，英文亮色，默认偏好与合成仓库，无凭据、SW 禁用；[375](UI/evidence/p1/t011-settings-375.png)、[768](UI/evidence/p1/t011-settings-768.png)、[1024](UI/evidence/p1/t011-settings-1024.png)、[1280](UI/evidence/p1/t011-settings-1280.png)、[1440](UI/evidence/p1/t011-settings-1440.png)。1440px 内容实测 1264px；五档均无页面横向溢出、设置内层活动滚动区为 0、选择控件最小高度 44px。高度 400px 的 [375 页尾](UI/evidence/p1/t011-low-height-375.png)、[1440 页尾](UI/evidence/p1/t011-low-height-1440.png) 可到达。原始测量摘要见 [layout-metrics.json](UI/evidence/p1/layout-metrics.json)。

375px 简中暗色：[手机队列](UI/evidence/p1/t011-queue-375.png)、[排序浮层](UI/evidence/p1/t011-popper-375.png)、[复制表单弹窗](UI/evidence/p1/t011-dialog-375.png)、[图片预览](UI/evidence/p1/t011-preview-375.png)。排序浮层实测 z-index 3005，主题 surface 正确；弹窗 x=16、宽 343、高 260px，输入、取消与确认可见。预览由 E2E 检查遮住顶栏与 Esc 关闭。旧 ElPopover 只留在未挂载的旧头像 / 快捷工具，当前账户使用 HeaderMenu；保留代码而不为验收重新引入旧入口。

**P1 准出结论**：T006–T011 全部完成，每项独立提交，现有登录、上传、管理、设置、公告和反馈可在新公共布局内使用。总体 11 / 48；P2–P6 保持未开始。原配置导航、完整重连恢复、业务页视觉重构、真实 GitHub 写入、跨浏览器和完整 PWA 验收继续由对应后续任务收口，不以 fixture 替代。

**回滚**：回滚本任务布局与样式提交可恢复上一任务布局；整个 P1 按六个任务提交回滚，不改用户配置、凭据或远端文件。未修改设计稿、删除源文件、推送或执行真实上传 / 部署。

## P2 登录与配置合并

2026-10-16 开始，起点 `d1a20a2`，分支 `develop`，工作区干净；相对远端领先 14 个提交。本阶段按方案末尾 P2 模块图实施，不改画稿、不删除文件、不推送。真实认证与仓库写入由脱敏 mock 替代，不代表 P6 远端验收通过。

### T012 提供类型化请求结果与目录查询

**实施提交**：`feat(api): add typed safe request results and directory queries`（本节所属提交）。

`requestResult` 复用唯一 GitHub Axios 客户端并以端点守卫验证 unknown；空数组、非法结构、401 / 403 / 404 / 409 / 429 / 5xx、限流头、离线与普通网络失败分别处理。旧 request 保留 data / null、204 与显式 422 兼容，通知使用本地翻译，取消原始错误日志。最终 URL 只允许精确 GitHub API origin 注入存储凭据，显式鉴权优先，外域移除鉴权。目录 API 不再写 Store，旧管理页与复制仓库后的刷新经 repository-content 服务完成。

**验证**：`pnpm verify` 退出 0：lint、stylelint、typecheck、4 文件 / 27 单测、build 通过。新增 12 项请求测试使用内存 Axios adapter，无网络请求，验证新旧兼容、目录空 / 失败、鉴权优先与外域隔离。命令沿用 `/private/tmp/picx-ui-p1-bin/pnpm` 的 pnpm 11.18.0、Node 24.21.0 与单次 `verifyDepsBeforeRun=false`；日志 `/private/tmp/picx-p2-t012-verify.log`。`git diff --check` 通过。未改用户界面布局，无新增截图要求。

**回滚**：回滚本任务提交可恢复旧请求与管理刷新调用；存储格式、API 远端协议未变。

### T013 提取 GitHub 连接与仓库初始化服务

**实施提交**：`feat(auth): extract reentrant GitHub connection and initialization`（本节所属提交）。

新增 GitHub 连接 API、服务和 composable，服务不导入 Router / Store；唯一内存连接状态由 Pinia 共享，旧配置页一键配置改调同一服务。显式验证账户、实际仓库与分支后才就绪；已有分支和四模式目录保留，只有确认默认仓库 404 才创建，创建 422 后重新读取，空分支列表才初始化 README。OAuth 安装列表为空与权限错误区分。重复入口共用进行中的尝试，登出递增代次并清理内存认证，过期响应不能继续写仓库或提交。验证失败保留旧配置；保存失败保留旧内存与存储快照，不新建凭据键。

**验证**：`pnpm verify` 退出 0：lint、stylelint、typecheck、5 文件 / 35 单测、build 通过；日志 `/private/tmp/picx-p2-t013-verify.log`。新增 8 项服务测试覆盖首次初始化、已有仓库 / 分支 / 目录、部分失败重试、创建冲突、App 未安装、权限错误、重复触发、登出失效、验证与存储失败；API 均为 mock，无真实仓库创建或初始化。`git diff --check` 通过。

**回滚**：回滚本任务提交恢复旧配置页编排；沿用原字段与存储键，旧页面文件完整保留。登录页呈现与路由切换分别由 T014、T015 完成。

### T014 实现 OAuth 与 Token 双卡片登录

**实施提交**：`feat(ui): add OAuth and Token connection cards`（本节所属提交）。

按 `DZzo7` 实现连接引导、真实三步流程、等宽双卡片、安装 / 授权教程 / Token 创建与教程入口。Token 为局部草稿，默认掩码，显式可见性按钮支持键盘；Enter 与提交按钮调用同一连接方法，验证失败不保存、不清空草稿，加载时两方式防重，错误就地展示并支持重试。凭据保存提醒准确描述当前浏览器存储。手机纵排，输入 16px；本地 Lucide 增补图标保留官方来源和许可证。

**验证**：`pnpm verify` 退出 0，lint、stylelint、typecheck、35 单测、build 通过。Chrome E2E 首次运行 46 / 48 通过；2 项视觉测试因同 URL 重开未触发 fixture 重注入失败，改用真实语言 / 主题菜单切换后，两项单独复验通过（日志 `/private/tmp/picx-p2-t014-e2e.log`、`/private/tmp/picx-p2-t014-visual.log`）。新增流程覆盖 Token 输入不持久化、401 后重试、Enter / 按钮、网络恢复、防重复、App 未安装及可恢复入口。所有请求由 fixture 拦截，测试凭据为不可用于认证的占位字符串；截图表单为空，没有真实 OAuth 或写入。

视觉已读取画稿并检查 Chrome、简中、亮色 [1440×1080](UI/evidence/p2/t014-login-1440.png)、[375×812](UI/evidence/p2/t014-login-375.png)，以及 [375 英文暗色](UI/evidence/p2/t014-login-375-en-dark.png)。桌面卡片各 520px、间距 24px；375px 无页面横向溢出，图标按钮 / 链接触摸目标至少 44px。`components.d.ts` 由构建插件移除不再使用的声明。

**回滚**：回滚本任务界面、翻译、图标与测试提交；连接服务仍可由旧配置页使用。旧回调与路由兼容将在目录弹窗具备功能后由 T015 统一收口。

### T016 实现仓库上下文与连接状态

**实施提交**：`feat(ui): show verified repository context and recovery states`（本节所属提交）。

新增只接收无凭据 repository、uploadPath、connection 与禁用状态的上下文组件，上传页负责连接恢复、配置与重连事件。实际仓库链接、分支和已保存路径回显，长路径可展开并键盘操作；仅与当前仓库身份匹配的验证结果显示公开 / 私有提示。待验证、连接中、失效、无权限、离线和其他失败分别展示。上下文配置入口暂时沿用旧配置页，T019 接入同一目录弹窗。新增官方同源本地图标；修复原目录标签在长路径时撑宽手机布局。

**验证**：`pnpm verify` 退出 0，lint、stylelint、typecheck、6 文件 / 42 单测、build 通过；Vitest 增加已安装 Vue 插件以执行真实组件测试，无新依赖。新增 7 项组件测试验证错误分支、可见性证据、仓库匹配与事件。构建后连接 / 上下文 E2E 9 / 10 通过，长路径旧标签修复后 stylelint、build 与上下文两项复验通过；日志 `/private/tmp/picx-p2-t016-verify.log`、`/private/tmp/picx-p2-t016-context-recheck.log`。Chrome、简中亮色：[1440](UI/evidence/p2/t016-context-1440.png)、[375 长路径](UI/evidence/p2/t016-context-long-375.png)，无页面溢出；fixture Token 为空，显示待验证，无虚构连接或公开提示。`components.d.ts` 由构建生成，diff 检查通过。

**回滚**：回滚组件、上传页接入、图标、翻译与测试提交，不改变仓库或目录存储。

### T017 实现路径规则与目录草稿事务

**实施提交**：`feat(upload): add validated directory drafts and atomic persistence`（本节所属提交）。

路径纯函数统一四模式草稿、展示 / 存储 / API 路径、日期解析与批次目标快照。新路径只规范化首尾空白及展示斜杠，保留内部字符；空分段、点分段、反斜杠、控制字符与超过五层显式失败。Store 不再替换字符或截断目录；新增 action 先校验并持久化候选值，再一次发布目录三字段，存储失败不修改旧配置。composable 的取消、关闭、保存失败均保留正确事务边界，保存不改 viewDir。批次开始解析当天日期并锁定目标，上传中阻止保存和重置，单文件 API 路径逐段编码。管理页初始化只调整浏览目录，不再重置上传目录。

**验证**：`pnpm verify` 退出 0，lint、stylelint、typecheck、7 文件 / 62 单测、build 通过；新增 20 项测试覆盖根 / 首尾空白 / 内部字符 / 分隔符 / 点分段 / 反斜杠 / 五六层边界 / API 解码一致 / 午夜与固定快照 / 取消 / 发布顺序 / 存储失败重试 / 上传锁 / viewDir。测试发现锁定时应优先报告忙碌，已调整保存顺序。日志 `/private/tmp/picx-p2-t017-verify.log`，diff 检查通过。Node 24.21.0、pnpm 11.18.0 已重新读取确认。弹窗用户流程与双入口由 T019 验收，无真实上传或写仓库。

**回滚**：回滚本任务代码与记录，恢复旧保存与上传目标处理；原目录字段和存储键兼容，无持久化新字段。
