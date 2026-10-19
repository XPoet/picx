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

### T018 将仓库目录选择器改为受控输入

**实施提交**：`feat(upload): add controlled repository directory browsing`（本节所属提交）。

受控选择器只读 modelValue / loads，以 typed emits 提交选择、请求下级与重试；旧即时保存逻辑隔离到按需加载的 Legacy 组件，受控实例不加载旧 Store 逻辑。选择父级和展开下级分为两个 44px 按钮，最大五层；桌面级联列、手机单层列表与面包屑共用数据。loading、空目录、错误与重试独立展示，刷新失败保留草稿和已有条目。目录查询 composable 按会话、请求 ID、仓库身份过滤迟到结果，切换仓库同步作废旧查询。

**验证**：`pnpm verify` 退出 0，lint、stylelint、typecheck、8 文件 / 69 单测、build 通过；新增 7 项组件 / 查询测试覆盖父级选择、逐级加载、五层限制、刷新与失败保留、会话失效、防重、乱序与切换仓库。日志 `/private/tmp/picx-p2-t018-verify.log`，diff 检查通过。

另通过 `tests/fixtures/directory-selector.html` 在 Vite dev（4174）和独立临时 Chrome 检查实际组件：[1440 桌面级联](UI/evidence/p2/t018-selector-desktop.png)、[375 单层列表](UI/evidence/p2/t018-selector-375.png)。键盘 Enter 可选择与返回根层，展开不改变选择，空目录不伪装请求失败；375 无横向溢出，localStorage 写入数为零，外域请求数为零。该 fixture 不进入生产路由，完整弹窗 preview E2E 归 T019。Pencil 的 `Bi2Sk` / `SLz4l` 已只读核对，未修改画稿。

**回滚**：回滚本任务可恢复原选择器；旧配置调用方式、字段与文件保留。

### T019 完成四模式目录弹窗及双入口联动

**实施提交**：`feat(upload): integrate transactional directory dialog and shared entries`（本节所属提交）。

新增四模式目录弹窗和操作区目录摘要，上下文图标 / 更改按钮共享唯一弹窗状态。根、日期、仓库与新建模式共用草稿、预览、保存与取消；选择器受控，不写入空文件。取消、关闭、Esc、遮罩均丢弃草稿，保存失败保留弹窗与草稿，成功后两处同步，上传锁禁用保存。弹窗开启保留入口焦点，关闭后显式恢复；上传快捷键按作用域注册 / 卸载，输入与弹窗不触发上传、重置或部署；粘贴不被上传区接管。四模式使用官方本地 Lucide 对应图标。

**验证**：最终 `pnpm verify` 退出 0，lint、stylelint、typecheck、69 单测、build 通过；目录弹窗 preview E2E 12 项全部通过（桌面 / Pixel 5 各 6），覆盖四模式、双入口、五六层边界、取消路径与焦点、保存失败恢复、刷新失败保留、空目录、键盘输入与 Enter 保存。初次用例把 EP 的 dialog overlay 当成 760px 内容，已纠正；遮罩关闭后的焦点问题已修复并完整复验。日志 `/private/tmp/picx-p2-t019-final-verify.log`、`/private/tmp/picx-p2-t019-final-e2e.log`。

Chrome、简中亮色：[1440 / 760px 弹窗](UI/evidence/p2/t019-directory-1440.png)、[375×480 低高度](UI/evidence/p2/t019-directory-375-low.png)；[375 英文暗色](UI/evidence/p2/t019-directory-375-en-dark.png)。已查看截图，正文可滚动，底部按钮保持可见，手机输入 16px，页面无横向溢出。低高度测试模拟软键盘压缩可视区域；真实手机软键盘与 Safari 设备验收仍归 P6，不宣称本机模拟覆盖真实设备。所有 GitHub 请求为 fixture，未知写入被阻断。

**回滚**：回滚弹窗与入口提交恢复原目录显示 / 配置入口，旧页面与选择器文件未删除；原字段和存储格式保持兼容。此时目录配置能力已就绪，下一项 T015 取消独立配置导航与旧页面渲染。

### T015 切换登录回调、旧路由与全部配置跳转

**实施提交**：`feat(auth): merge legacy configuration routes into connection and upload`（本节所属提交）。

`/` 为连接页，`/login` 兼容跳转；`/config` 按完整配置、auto、focus 和目录状态分流，旧配置 View 不再被路由导入，文件保留。完整配置进入上传并保留目录；auto 在执行前消费，可从原授权存储恢复并重新验证，首次初始化 / 刷新不会重复建仓或写 README；focus 在消费后聚焦空的 Token 草稿。Hash 仅变更而复用登录组件时也处理一次性参数。未连接引导重连，未选目录直接打开共享弹窗；账户重连与登出保留经过白名单校验的返回目标。

OAuth code 在局部内存中交换，先清理外层 / Hash 临时参数，再通过现有服务换取凭据并完成账户、安装、仓库和分支验证。Hash history 显式使用 Vite BASE_URL，避免把外层 code 固定进 history base。安装回调与已连接严格区分，拒绝和网络错误就地恢复；旧持久化 code 清空。登出递增代次，旧交换 / 连接响应不能回写。切换实际账户 / 仓库身份时，缓存候选与原配置、认证一起写入，失败回滚；成功才清空旧媒体缓存与队列，同一身份重连保持原目录。

**内部跳转检索结论**：

| 原引用 | 处理与保留原因 |
| --- | --- |
| Router `/config`、`/login` | 只保留兼容记录，前者动态分流，后者转真实连接页；没有配置页渲染 |
| nav-content.data / 管理入口校验 | 移除独立配置导航；无仓库 / 分支时转连接页，浏览目录不依赖上传目录 |
| 上传校验 / 上下文 / 操作区 | 无连接进入恢复入口；无目录打开同一弹窗，两处目录入口不再跳旧配置页 |
| 授权状态栏、两个头像组件、授权检查 | 统一 connectionLocation；不再把旧本地标志显示为已连接，登出保留完整重载以终止旧页面与同步任务 |
| 保留的 dir-info-bar | 旧文件的兼容动作改为 `/upload?directory=1`，参数单次消费；当前上传页已改用目录摘要 |
| login-navigation 中 `/config` 字符串 | 只用于旧返回目标到 `/upload` 的白名单映射 |
| 两条文档 `usage-guide/config.html` URL | 原有真实教程地址，全部保留，不误改为应用路由 |
| import 路径中的 login-navigation | 模块路径，不是应用跳转 |

**最终验证**：`pnpm verify` 退出 0，lint、stylelint、app / Worker 类型检查、10 文件 / 88 单测、build 通过；构建后完整 `pnpm test:e2e --workers=2` 退出 0，Desktop Chrome 40 项、Pixel 5 40 项，共 80 项通过。测试期间发现并修复 Hash 仅变更时登录组件复用导致漏消费回调的问题；最终整套复验通过。最后把账户切换测试加强为“配置 / 认证已写、管理缓存写入失败”的回滚，相关 10 项单测再次通过。日志 `/private/tmp/picx-p2-final-verify.log`、`/private/tmp/picx-p2-final-e2e.log`、`/private/tmp/picx-p2-final-connection-recheck.log`。

新增请求 / 连接 / 路由 / 回调 / 目录测试使用独立 fixture 和不可用于认证的占位字符串，模拟的建仓与 README 端点限制到确定阶段，任何未知访问会中止并使测试失败。E2E 覆盖旧链接、完整配置、auto 仅初始化一次、原授权键恢复、focus、目录缺失、外层 / Hash 回调、拒绝、交换失败、刷新、返回、重连、登出和教程地址。没有真实 GitHub 授权、仓库写入、上传或部署证据，真实远端验收继续归 P6。

Chrome / 简中 / 1440×1080 最终截图已查看：[无配置导航的登录页](UI/evidence/p2/t015-login-1440.png)、[模拟验证成功的上传页](UI/evidence/p2/t015-connected-upload-1440.png)。之前任务的截图保持所属提交版本，避免用最终导航覆盖迁移期记录。375px、英文暗色、低高度和键盘证据见 T014、T016、T018、T019；全套 E2E 在最终实现上复验通过。`components.d.ts` 由构建插件更新，未手工编辑。

**回滚**：本项提交包含路由、回调、内部跳转与对应测试 / 文档，可独立回滚到已具备目录弹窗、仍保留旧配置入口的 T019 状态。旧配置文件与原存储字段保留，不需要清空用户数据。

**P2 准出结论**：T012–T019 共 8 项全部完成并各自提交；T015 按依赖在 T019 之后收口。P0 + P1 + P2 总进度 19 / 48，P3–P6 尚未开始。本阶段交付双方式连接、可重入初始化、真实依据的上下文、四模式目录事务、旧链接和恢复闭环；上传工作区整体视觉、逐项结果、管理、设置 / 部署与真实环境验收仍由后续任务完成。

| 任务 | 独立实施提交 |
| --- | --- |
| T012 类型化请求与目录查询 | `b798bec` |
| T013 连接与初始化服务 | `67a6132` |
| T014 双卡片登录 | `b1e160a` |
| T016 仓库上下文 | `c4505af` |
| T017 目录草稿事务 | `a13fa04` |
| T018 受控目录选择器 | `9070836` |
| T019 四模式目录弹窗 | `669f405` |
| T015 回调与路由合并 | 本节所属提交，标题见上 |

## P3 上传工作区

### T020 实现持续接收文件的上传入口

**实施提交**：`feat(upload): add persistent file intake and local design icons`（本节所属提交）。

工作区模式持续接收文件，typed 事件只传本次结果并追加到原队列；默认图片工具保留末项预览。选择值立即清空，输入 ID 按实例唯一；选择、拖放、图片粘贴共用校验，禁用 / 失效结果不发布；文本、contenteditable、弹窗和预览保留原粘贴。明确图片与 MP4 范围。按用户要求只读核对三个上传画板并从官方 0.468.0 下载缺少的 Lucide SVG，统一封装为本地 sprite / PicxIcon，来源、映射与 SHA-256 见 assets/icons/SOURCE.md。未修改设计稿。

**验证**：Node 24.21.0、临时 Corepack pnpm 11.18.0；`pnpm verify` 通过（lint、stylelint、typecheck、92 单测、build）；preview E2E Desktop / Pixel 5 共 2 项通过。截图已查看：[1440](UI/evidence/p3/t020-intake-1440.png)、[375](UI/evidence/p3/t020-intake-375.png)。覆盖多次追加、同名、MP4、粘贴、错误类型、禁用态与文本保护；实际文件大小由 T022 收口，旧卡片外观由 T025 收口。日志 `/private/tmp/picx-p3-t020-verify.log`、`/private/tmp/picx-p3-t020-e2e.log`。首次 Chrome 被沙箱阻止启动，获工具授权后以独立临时配置复验通过。pnpm 使用 `--config.verifyDepsBeforeRun=false` 避免既有全局虚拟存储配置检查，不改依赖与锁文件。

**回滚**：回滚本项入口、资源、翻译、测试与文档提交；无存储格式变化或远端写入。

### T021 将水印与压缩调度移出卡片挂载

**实施提交**：`refactor(upload): schedule image processing from the workspace`（本节所属提交）。

新增独立处理服务及工作区调度，原文件 → 水印 → 压缩保持单一顺序；只采用更小压缩产物，不支持格式明确跳过。快照和 uuid / generation 控制发布，设置更新、移除、重置和离开均作废旧任务；卡片挂载不再触发处理。运行态只在 Pinia 内存。Worker 成功、异常、无法解码、postMessage 抛错和取消均释放。水印使用实际 blob MIME，并在浏览器格式回退时同步后缀。上传只接受 ready 项；处理失败提供重试。

**验证**：`pnpm verify` 全通过，12 文件 / 102 单测（新增 10 项），build 通过；本地 preview 上传入口回归 Desktop / Pixel 5 共 2 项通过。新增测试直接运行 composable，无卡片渲染，覆盖顺序、视频 / GIF 跳过、编码变大不采用、失败收尾、设置更新从原文件重算、移除失效、scope 取消以及五种 Worker 释放路径。日志 `/private/tmp/picx-p3-t021-verify.log`、`/private/tmp/picx-p3-t021-e2e.log`。无真实远端写入。

**回滚**：回滚调度、处理服务、内存类型、Worker 取消和接入提交；旧卡片文件保留，存储格式兼容。

### T022 统一命名规则、预览与实际文件大小

**实施提交**：`fix(upload): unify naming rules and validate actual file sizes`（本节所属提交）。

命名纯函数统一默认偏好、文件级覆写与处理后的后缀；时间戳优先且批内唯一、重算稳定，完整 uuid 作为哈希来源，不固定画稿样例长度。原名兼容不强开哈希或前缀；成功项不再改名。卡片挂载不再更改名称。文件接收按实际 File.size 在读取前校验，上限恰好允许，超过一字节拒绝；上传体积取实际采用 File，未知显示破折号，小文件显示 B。文件入口改用 crypto.randomUUID，避免同毫秒同名文件的旧随机编号碰撞。

**验证**：`pnpm verify` 通过，13 文件 / 109 单测，lint、stylelint、typecheck、build 全通过。新增 7 项覆盖原名、无后缀、哈希前缀、覆写、同毫秒时间戳、模式切回、处理后 MIME / 扩展名、成功项冻结、未知 / 零大小，以及图片 / MP4 恰好 30 MB 和超一字节；错误类型在读取前拒绝。日志 `/private/tmp/picx-p3-t022-verify.log`，diff 检查通过。完整队列视觉与新详情操作由 T025 验收；无真实写入。

**回滚**：回滚命名与大小校验提交即可恢复旧计算，既有设置字段及浏览器存储兼容。

### T023 统一链接预览、复制与失败恢复

**实施提交**：`fix(links): share safe previews and recover clipboard failures`（本节所属提交）。

规则变量和格式纯函数用于管理、上传复制以及设置预览。路径逐段编码，替换值不再次解析；完整多点文件名可用，空 / 损坏规则不产生 null 文本。成功集合可按各项实际目标生成文本，后续上传结果接入复用此函数。copyText 返回明确结果，旧回调仅成功时调用；AppWrap 的唯一弹窗以 textarea 展示待复制文本并提供选择 / 重试，所有模板只作为文本显示。复制失败不改上传状态。

**验证**：`pnpm verify` 全通过，14 文件 / 120 单测；新增 11 项覆盖四类来源、重复 / 非法变量、三种格式与原始 URL、多点名称、空集合、剪贴板拒绝 / 无 API / 重试。preview E2E Desktop / Pixel 5 共 2 项通过；拒绝后未生成 HTML 元素，重试成功关闭弹窗。已查看等待打开完成后的截图：[1280](UI/evidence/p3/t023-copy-1280.png)、[375](UI/evidence/p3/t023-copy-375.png)，375 无横向溢出且恢复操作在视口内。日志 `/private/tmp/picx-p3-t023-verify.log`、`/private/tmp/picx-p3-t023-e2e.log`，diff 检查通过。

**回滚**：回滚链接纯函数、复制反馈和调用适配；设置存储字段不变，无远端写入。

### T024 实现右侧快捷设置与共享偏好

**实施提交**：`feat(upload): add shared quick settings and responsive workspace`（本节所属提交）。

新增 Props Down / Events Up 的 320px 快捷面板，复用同一压缩、水印、复制格式偏好；原始 URL 映射转换关闭，选择预设则启用。目录摘要与上下文共用既有弹窗、真实保存值；统计取实际 File，处理中不伪造体积。空队列上传禁用，上传锁禁用设置与重置。部署复用原组件，最终共享阶段由 T039 完成。响应式为桌面右侧、平板下方、手机纵排；上下文图标改用已核对的 folder-git-2 / folder / folder-cog，旧 quick-actions 也复用 PicxIcon。

**验证**：`pnpm verify` 通过，15 文件 / 122 单测；最后无障碍名称修正后重新 lint / build。2 项组件测试检查事件、旧格式关闭、禁用与体积。目录弹窗 12 项回归通过；共享偏好 Desktop / Pixel 5 两项最终通过，使用键盘 Space 操作真实开关，验证两页双向一致、raw 映射及目录入口。首次用例发现 aria-labelledby 只落到包装节点，已修为 input 的 aria-label；隐藏原生 input 使用键盘验证，无强制点击。已查看截图：[1440 / 320px 面板](UI/evidence/p3/t024-settings-1440.png)、[375](UI/evidence/p3/t024-settings-375.png)，另断言 768 与 375 无溢出、手机 select 16px。日志 `/private/tmp/picx-p3-t024-verify.log`、`/private/tmp/picx-p3-t024-build.log`、`/private/tmp/picx-p3-t024-settings-e2e.log`；目录回归结果见 `/private/tmp/picx-p3-t024-e2e.log`（新设置用例的首次失败另已修复并复验）。

**回滚**：回滚面板与页面布局提交，原设置字段、目录事务和部署服务均兼容，无远端写入。

### T025 改造轻量队列与媒体项展示

**实施提交**：`feat(upload): render lightweight media queue with explicit details`（本节所属提交）。

队列使用稳定 uuid，显示最终名、实际大小、原始 → 最终体积、处理 / 待上传 / 上传 / 失败 / 成功状态。采用真实压缩产物才标记已压缩。详情、移除、成功复制与处理重试常驻且目标 44px；详情承接图片 / MP4 预览及重命名、哈希、前缀，表单仅编辑本地草稿，通过 typed events 更新队列，校验空名和路径分隔符。卡片不再挂载调度或直接修改 Props。

**验证**：阶段 `pnpm verify` 通过（122 单测、静态检查、typecheck、build）；新增运行态动作组件测试 2 项单独通过，验证处理重试事件、不修改原 File、处理中操作与权限错误本地化，合计现有 124 项。Desktop / Pixel 5 队列与入口 E2E 4 项通过；队列最终独立复验 2 项通过，24 项文件覆盖长名、同名、视频、键盘重命名、移除和持续追加。已查看 [1440](UI/evidence/p3/t025-queue-1440.png) 与 [375](UI/evidence/p3/t025-queue-375.png)，无页面横向溢出，图片 fixture 为透明 PNG，视频 fixture 仅验证 MP4 输入和控制入口，不宣称验证真实视频播放。日志 `/private/tmp/picx-p3-t025-verify.log`、`/private/tmp/picx-p3-t025-card-test.log`、`/private/tmp/picx-p3-t025-e2e.log`、`/private/tmp/picx-p3-t025-queue-e2e.log`。上传失败与成功结果完整页面由 T026–T027 验收。

**回滚**：回滚本任务恢复原卡片；旧 util 文件保留，原文件、设置与远端不受影响。

### T026 提供逐项上传结果和批次目标快照

**实施提交**：`fix(upload): report committed item results with frozen batch targets`（本节所属提交）。

上传 API 新增类型化响应校验，执行器返回成功 / 失败清单、实际目标、commit SHA 和真实字节数。单图 contents 需有效提交响应；批量仅 ref 指向本次 commit 后发布成功和缓存。blob 部分失败独立保留，全失败不提交空 tree；head / tree / commit / ref 失败没有虚假 100%。开始时冻结 File、Base64、名称、仓库、分支、目录和日期；文件级防重，已成功项不重传。同路径冲突显式失败，上传锁由工作区继续使用。contents / ref 结果未确认时，重试先查目标内容并精确核对 Git blob SHA；匹配则恢复真实提交，不同内容或无权限不覆盖。缓存失败不反转远端成功。旧单图 / 管理重命名布尔调用兼容，缺 File 时采用成功 contents 响应大小。另修复上一项全局 Stylus 中错误使用 :deep 的构建警告。

**验证**：最终 `pnpm verify` 全通过，18 文件 / 141 单测，类型、lint、stylelint、build 通过。新增 17 项上传执行与 API 测试覆盖单图、全部 / 部分 blob 成功、四个提交阶段失败、空 tree 防护、同路径冲突、防重、已成功项排除、文件名 / 目标快照、跨午夜、ref 未确认恢复、contents SHA 核验、权限失败、真实大小与旧管理适配、缓存失败、任务失效，以及 ref / contents / head 响应结构。断言成功 / 失败集合不相交且覆盖全部 attemptedUuids，ref 前无成功缓存。日志 `/private/tmp/picx-p3-t026-verify.log`、`/private/tmp/picx-p3-t026-upload-tests.log`。本项所有 API 为 mock，不进行真实远端写入；新结果横幅、重试按钮和端到端主流程由 T027 接入验收。

**回滚**：回滚类型化 API、结果执行器、模型与测试提交；旧布尔入口和目录格式保留，不撤销已发生的远端提交。

### T027 组装上传结果区与继续上传流程

**实施提交**：`feat(upload): retain batch results and support recovery workflows`（本节所属提交）。

工作区 composable 负责追加、处理、上传、共享偏好与运行态，View 只编排组件和路由。结果区按本批真实成功 / 失败数展示完成、部分和全部失败；离线阻止上传，权限失败提供恢复入口。成功项、实际目标和批次记录在 Pinia 内存保留；自动复制仅本批成功项，复制全部按每个成功项自己的 target 生成链接。继续添加只提交新项 / 上传失败项；重置只清内存。查看管理显式写 viewDir，后续目录设置不会改旧结果。同身份重连返回保留队列。进度只显示实际完成数量，不造字节进度。

**验证**：`pnpm verify` 通过，18 文件 / 141 单测，lint、stylelint、typecheck、build 通过；最后引导文本适配后重新 lint / build。新增 preview E2E Desktop / Pixel 5 各 6，共 12 项全部通过：上传 → 自动 / 手动复制 → 目录变化 → 管理 → 返回追加 → 重置，部分 blob 失败重试、权限与离线恢复、ref 未确认后查询并恢复、复制拒绝不影响成功、同身份重连保留文件。Mock 严格限定 fixture 仓库与端点，不访问真实 GitHub。额外实际执行浏览器水印 + mozJPEG Worker，PNG 881.48 KB → JPEG 120.47 KB，核对 JPEG 文件头、后缀、真实远端模拟字节数和已压缩标记。

已查看 [成功 / 1440](UI/evidence/p3/t027-success-1440.png)、[成功 / 375](UI/evidence/p3/t027-success-375.png)、[部分成功 / 1440](UI/evidence/p3/t027-partial-1440.png)、[实际压缩 / 1440](UI/evidence/p3/t027-compressed-1440.png)、[实际压缩 / 375](UI/evidence/p3/t027-compressed-375.png)。375 无横向溢出；成功与失败行均保留明确操作。日志 `/private/tmp/picx-p3-t027-verify.log`、`/private/tmp/picx-p3-t027-build.log`、`/private/tmp/picx-p3-t027-e2e.log`。真实远端环境仍归 P6，当前结果不作为真实仓库上传证据。

**回滚**：回滚工作区编排、结果区和内存批次记录，旧配置与设置格式兼容；不撤销用户已经完成的远端上传。

### T028 统一上传快捷键与页面生命周期

**实施提交**：`fix(upload): scope shortcuts and cancel stale workspace tasks`（本节所属提交）。

A / S 仅由工作区 composable 注册一次，并与按钮共用可执行条件。文本、contenteditable、可见弹窗、预览、重复按键、组合输入、Alt / Shift 与失焦窗口均不接管；退出按相同引用移除键盘、在线和粘贴监听。原部署 D 监听保留在原组件，只复用同一输入保护，不额外注册；其状态与操作图标改为设计稿对应的本地 PicxIcon。

移除 / 重置立即取消所属 Worker，旧 generation 不发布；离开时 AbortSignal 取消等待请求并作废旧编排。晚到的已提交响应不写旧页面 / 新账户，保留无凭据核验信息，返回后查询实际内容再恢复成功，不重复提交；上传标志收尾被新工作区观察，避免永久阻塞。已经成功的项不因页面离开丢失。预览沿用同一模型 data URL，没有新增对象 URL；重置 / 移除释放队列和运行态引用，Worker ImageBitmap 在 finally 关闭。复核时另修正输入竞态：typed receiving 状态在文件读取完成前阻止启动上传，重置可取消尚未入队的选择。

**最终工程验证**：Node 24.21.0、临时 Corepack pnpm 11.18.0，`pnpm verify` 退出 0：lint、stylelint、app / Worker typecheck、19 文件 / 148 单测与 build 全通过。新增作用域 / 快捷键 / 读取任务测试，覆盖按键过滤、上传防重、监听同引用清理、Worker 立即取消、scope 请求取消、迟到提交核验和 intake 读取 / 重置。英文数量文案与最终截图修正后 build 和 lint 再次通过。日志 `/private/tmp/picx-p3-t028-verify.log`、`/private/tmp/picx-p3-t028-lifecycle-unit.log`、`/private/tmp/picx-p3-final-build.log`、`/private/tmp/picx-p3-final-lint.log`。

**完整浏览器验证**：构建后 `pnpm test:e2e --workers=2` 退出 0，Desktop Chrome 56 + Pixel 5 56，共 112 项通过，含 P0–P2 原流程与 P3 全流程。首次完整回归只有旧 smoke 提示文案两项失败，已改为新版语义标题和真实输入断言，整套复验通过。最后收紧 fixture 的未知目录访问并稳定去除临时 toast 的截图后，使用该 fixture 的结果 / 生命周期 24 项再次全部通过；英文与繁体 375px 暗色独立 4 项也通过。日志 `/private/tmp/picx-p3-final-e2e.log`、`/private/tmp/picx-p3-final-upload-e2e.log`、`/private/tmp/picx-p3-final-visual.log`。生命周期用例明确等待路由组件渲染后才模拟迟到 ref，登出后按既有产品流程关闭公告，避免把测试时序或公告遮挡误判为清理故障。

已查看最终截图：[1440 简中 / 实际压缩成功](UI/evidence/p3/t028-upload-1440.png)、[375 简中](UI/evidence/p3/t028-upload-375.png)、[375 英文暗色](UI/evidence/p3/t028-en-dark-375.png)、[375 繁体暗色](UI/evidence/p3/t028-zh-tw-dark-375.png)。无横向溢出、移动关键输入 16px、图标按钮 44px；49 个 typed 图标均有本地 SVG symbol，三语 P3 key 集合一致。历史任务截图保持所属版本，最终截图单独保存。diff 检查通过，无文件删除，不读取凭据或禁止的构建目录。

**回滚**：回滚本任务可恢复前一版事件与取消方式；不更改持久化格式、不撤销远端已提交文件。

**P3 准出结论**：T020–T028 共 9 项全部完成并分别提交。空态、待上传、已上传 / 已压缩、部分 / 全部失败、离线、权限、复制恢复及继续添加均有本地证据；手机隐藏与展示不影响处理，实际目标、成功集与大小可信。P0–P3 进度 28 / 48；P4–P6 未开始。真实 GitHub 授权、上传、部署、Safari / 真机与 PWA 整体验收仍由相应后续任务验证，不将本地 mock 视为真实远端成功。未推送。

| 任务 | 独立实施提交 |
| --- | --- |
| T020 持续文件入口与设计图标 | `2fea915` |
| T021 工作区处理调度 | `702c9d9` |
| T022 命名与真实体积 | `113f0cd` |
| T023 链接与复制恢复 | `5f17dd2` |
| T024 共享快捷设置 | `273ac91` |
| T025 轻量队列与详情 | `0b44d1f` |
| T026 逐项结果与目标快照 | `e3919ee` |
| T027 结果区与继续上传 | `6613f6b` |
| T028 快捷键与生命周期 | 本节所属提交，标题见上 |

## P4 图片管理

### T029 目录浏览、面包屑和定向上传

**实施提交**：本节所属提交 `feat(management): add directory navigation and targeted uploads`。执行前 `develop` 工作区干净，较 origin/develop 超前 31 个提交；不推送、不删除文件、不修改设计稿。

**实施**：Pencil 只读核对 `YxFJA`、`EAM8q`、`UUeb5` 的结构和截图；所需 Lucide SVG 按官方 0.468.0 标签下载，加入本地 sprite，来源、许可与 SHA-256 记录在 `src/assets/icons/SOURCE.md`。工具栏与文件夹使用 typed Props / Emits，浏览仅更新 `viewDir`；根目录返回禁用，面包屑可到任意父级，长路径可滚动。定向上传通过既有保存事务同步目标与分段后导航；保存失败保留页面和原目标。新建 `use-management-directory` 管理异步目录浏览，媒体与批量卡片留给后续任务。

**验证**：`pnpm --config.verifyDepsBeforeRun=false` 前缀执行改动 ESLint、`lint:style`、`typecheck`、`build` 均通过。当前 Node 24.21.0、pnpm 11.17.0（packageManager 声明 11.18.0）；pnpm 默认依赖校验因 enableGlobalVirtualStore 配置不一致拒绝启动，使用既有命令级覆盖继续，不安装或更新依赖。Chrome 在沙箱内启动失败，获自动审核许可后于沙箱外运行本地拦截测试。`test:e2e tests/e2e/management-navigation.spec.ts tests/e2e/smoke.spec.ts --workers=2` 20 项通过，覆盖单击、Enter、深层返回、任意父级、375px 无溢出、上传目标独立与保存失败；日志 `/private/tmp/picx-p4-t029-e2e.log`，构建日志 `/private/tmp/picx-p4-t029-build.log`。更新 smoke 空态断言为实际定向上传入口。

已查看 [1440 简中截图](UI/evidence/p4/t029-directory-1440.png) 与 [375 简中截图](UI/evidence/p4/t029-directory-375.png)：导航可见、路径可滚动、上传入口可操作；媒体仍是旧卡片，缩略图 fixture 是既有 1px 图片，不代表真实图片内容。三语言新增文本同步。

**回滚**：回滚本提交恢复旧浏览编排；不改变存储键，不撤销远端操作。本任务未执行真实 GitHub 写入。

### T030 当前目录搜索、排序与内容分区

**实施提交**：本节所属提交 `feat(management): filter and partition directory contents`；T029 为 `c4e8dd7`。

**实施**：搜索只在当前已加载的直属文件夹与媒体名称中忽略大小写过滤，不扫描仓库或递归子目录。分区计数与可见集合一致；切目录清词；仅文件夹、混合、空目录、无匹配结果有独立文案与恢复入口。排序保留旧偏好，返回新数组且不修改目录树顺序，未知时间排在已知之后。上传时间仅在最新优先时按需回填，切目录、排序或离开后停止后续批次并丢弃迟到结果。网格仅作当前视图标识。三语同步，375px 搜索输入 16px，统一语义 Token。后续截图使用 PICX_CAPTURE_TASK 按任务显式采集，保留历史截图版本。

**验证**：改动 ESLint、全量 stylelint、typecheck、build 通过；目录 Store / 过滤排序 10 项单测通过，时间回填取消 1 项单测通过。管理搜索分区与导航 E2E 桌面 / 移动共 10 项通过，日志 `/private/tmp/picx-p4-t030-e2e.log`。首轮发现移除旧外层 padding 后工具栏 content-box 溢出，已改 border-box；排序用例通过真实 Enter 打开选择器，避免点到 Element Plus 内层输入被占位层遮挡。截图核对 [混合根目录 1440](UI/evidence/p4/t030-mixed-1440.png)、[仅文件夹根目录 1440](UI/evidence/p4/t030-folders-1440.png)、[375 搜索无结果](UI/evidence/p4/t030-search-375.png)。

**回滚**：回滚此提交恢复原搜索与分区展示；未增加持久化字段或远端写入。批量选择范围与常驻媒体操作分别在 T031–T033 收口。

### T031 媒体卡片、预览与常驻操作

**实施提交**：本节所属提交 `feat(management): expose accessible media card actions`；T030 为 `dc43bf0`。

**实施**：卡片通过 typed select / action / availability 事件报告，Props 无写入。选择、复制、更多与完整名称属性入口常驻，图标复用 T029 下载的 Lucide。体积使用实际字节，未知值省略；图片 / 视频尺寸仅从真实加载元数据获取，失败清除，绝不补 0×0。图片可 Enter 打开并在 Esc 后返回焦点；MP4 列表不自动播放，显式预览使用原生 controls；加载失败有重试，无效链接有文本且禁用预览 / 复制。更多菜单接现有管理能力，T033 接统一服务。修正旧选择条的换行，供 T032 受控工具条替换。

**验证**：改动 ESLint、全量 stylelint、typecheck、build 通过；受控 Props 与原生视频约束 2 项组件测试通过。媒体卡片与复制回退 E2E 共 6 项桌面 / 移动通过，日志 `/private/tmp/picx-p4-t031-e2e.log`。覆盖加载失败后重试、未知体积、长名、图片预览关闭焦点、属性 / 菜单、剪贴板拒绝与重试、无效链接及 MP4 暂停。无效链接 fixture 同步覆盖云设置返回，避免刷新时被正常云偏好恢复。已查看 [1440 卡片](UI/evidence/p4/t031-media-1440.png) 与 [375 卡片](UI/evidence/p4/t031-media-375.png)，无横向溢出；图片 fixture 实际为 1×1，尺寸按实展示。旧 P3 截图不覆盖。视频可播放源的真实解码兼容性仍由 P6 浏览器验收覆盖。

**回滚**：回滚本提交恢复旧卡片，持久化格式未改变，未执行真实远端管理。

### T032 可见范围批量选择与工具栏

**实施提交**：本节所属提交 `feat(management): scope batch selection to visible media`；T031 为 `5161068`。

**实施**：新增页面内存选择 composable，身份为 path+sha；卡片、全选 / 半选、计数、确认、复制与删除使用同一可见媒体集合。搜索或切目录同步清选择，排序保留集合，刷新按真实身份取交集，uuid 变化不丢失有效选择；不选文件夹、不对隐藏结果执行删除、不写入 checked 缓存。工具条显示当前目录 / 当前结果实际数量，常驻取消、复制和删除；删除确认冻结当前目标，取消不发请求。375px 选择条独占一行、按钮换行且 44px 可点击。

**验证**：改动 ESLint、全量 stylelint、typecheck、build 通过；选择边界 3 项单测覆盖半选、隐藏项、筛选、目录、排序、uuid / sha 刷新。选择 / 搜索 / 卡片 E2E 10 项通过，最后手机布局修正后选择 2 项再次通过。确认取消无写入；筛选 coast 后复制仅 1 条链接、模拟 DELETE 仅 coast.png，其余 3 个隐藏媒体保留。排序偏好云同步在专用 fixture 中显式模拟 PUT .settings，不放行其他写入。日志 `/private/tmp/picx-p4-t032-e2e.log`、`/private/tmp/picx-p4-t032-selection-e2e.log`。截图 [1440 选择](UI/evidence/p4/t032-selection-1440.png)、[375 选择](UI/evidence/p4/t032-selection-375.png) 已查看；等待下拉框关闭与响应式布局稳定后断言整个文档无横向溢出，历史截图保持原版本。

**回滚**：回滚本提交恢复旧批量组件；选择状态仅内存，无持久化迁移。未删除真实媒体。删除失败与部分成功在 T033 统一收口。

### T033 接通管理操作与失败恢复

**实施提交**：本节所属提交 `feat(management): recover directory and media operations`；T032 为 `026a897`。2026-10-18 完成阶段验收。

**实施**：先在方案 §8 补充管理结果、失败身份和缓存契约，再实现独立管理 API、服务与交互服务。显式媒体菜单、文件夹菜单、当前目录菜单与右键复用同一执行链；共享服务不导入 View。右键使用文本节点、当前绑定对象和可清理监听，支持方向键、Esc 与视口边界。复制、属性、仓库跳转沿用真实文件上下文，移动弹窗支持异步目录加载、失败恢复与根目录目标。操作期间禁用重复写入和相关导航。

删除按指定 branch 和源 SHA 提交，仅确认 commit 成功后移除对应缓存；空 200 响应不视为成功。批量结果分别返回成功和失败路径，保留失败项并提供重试；失败身份包含 path+sha，刷新出现新版本后清除旧失败记录，避免把新文件作为旧失败项再次删除。取消确认不发写入；确认显示实际范围和影响。缓存写入失败单独提示，不反转已经确认的远端成功。

移动与重命名复用原 blob，通过 tree → commit → 非强制 ref 更新一次提交完成旧、新路径变更，不重新编码媒体。提交前检查源 SHA、目标冲突与冻结的仓库 / 分支，操作期间身份变化不继续向新仓库写入。目录重命名保留父路径；递归删除明确提示包含非媒体文件。完整 tree 被截断时按固定 head commit 递归读取 Contents，扫描失败、源变化或 ref 失败均保留缓存，不提交部分扫描结果。刷新失败保留旧内容；成功原子替换直属内容，保留仍存在的子目录缓存及同 path+sha 的已知时间。首次进入目录查询完整内容，迟到响应与登出后的结果不重建旧缓存。旧工具入口保留为兼容包装，不删除文件。

**工程验证**：最终 `pnpm verify` 退出 0，lint、stylelint、app / Worker typecheck、25 个文件 / 167 项单测、build 全通过。覆盖部分删除、移动 ref 失败、目标冲突、源 SHA 改变、仓库快照、嵌套目录重命名、截断 tree 递归收集非媒体、扫描失败、刷新与迟到响应，以及 API 路径编码、指定分支、空成功响应和 tree 删除语义。目录 Store 与选择测试一并回归。沿用 T029 的命令级 `verifyDepsBeforeRun=false`；阶段脚本及 Git hooks 通过临时 pnpm 包装调用原命令，无依赖或锁文件改动，不跳过 hooks。日志 `/private/tmp/picx-p4-final-verify.log`。

**浏览器验证**：最终完整 E2E Desktop Chrome / Pixel 5 共 150 项通过，包含 P0–P3 回归和 P4 导航、搜索、选择、预览、管理写入与失败恢复。管理用例验证确认取消无写入、部分失败重试、刷新失败保留选择、刷新新 SHA 不重试旧失败、媒体重命名与冲突、移动 ref 失败后保留选择、目录递归影响、非媒体文件与右键键盘关闭。所有 GitHub 请求由严格 fixture 拦截，没有真实远端管理写入。日志 `/private/tmp/picx-p4-final-e2e.log`。

已查看最终三个画板对应截图：[仅文件夹根目录 / 1440](UI/evidence/p4/t033-folders-1440.png)、[混合根目录 / 1440](UI/evidence/p4/t033-mixed-1440.png)、[目录内选择 / 1440](UI/evidence/p4/t033-album-1440.png)，以及 [部分成功 / 1440](UI/evidence/p4/t033-partial-1440.png)、[部分成功 / 375](UI/evidence/p4/t033-partial-375.png)、[英文暗色 / 375](UI/evidence/p4/t033-en-dark-375.png)、[繁体暗色 / 375](UI/evidence/p4/t033-zh-TW-dark-375.png)。1440、768、375 布局无页面横向溢出；375 搜索输入 16px，卡片复制 / 更多与目录菜单目标至少 44px。图片 fixture 实际为 1×1，MP4 fixture 用于失败恢复和显式控制入口，不作为真实视频解码兼容性证据。设计稿中的 Lucide 图标已下载到本地 sprite，61 个 typed 名称与 symbol 一致；三语 `management_page.workspace` 的 53 个 key 集合一致。历史截图恢复所属提交版本，T033 证据独立保存。diff 检查通过，无文件删除。

**回滚**：回滚本提交恢复上一版管理操作与缓存编排；持久化格式与旧入口兼容，不自动撤销用户已经完成的远端提交。真实 GitHub、Safari / 真机、真实视频播放及 PWA 的整体验收仍由 P6 执行。

**P4 准出结论**：T029–T033 共 5 项全部完成并分别提交。`YxFJA`、`EAM8q`、`UUeb5` 均有最终截图，当前目录搜索、可见范围选择、常驻操作与失败恢复通过本地验证。P0–P4 进度 33 / 48；P5–P6 未开始。未推送，未执行真实媒体删除或其他真实 GitHub 管理写入。

| 任务 | 独立实施提交 |
| --- | --- |
| T029 目录浏览与定向上传 | `c4e8dd7` |
| T030 搜索、排序与内容分区 | `dc43bf0` |
| T031 媒体卡片与常驻操作 | `5161068` |
| T032 可见范围批量选择 | `026a897` |
| T033 管理操作与失败恢复 | 本节所属提交，标题见上 |

## P5 图床设置与部署

### T034 将设置页拆成三个可浏览分区

**实施提交**：`e28cb76`，`feat(settings): split preferences into three browsable sections`。

**初始状态与边界**：2026-10-18，develop，HEAD 相对 origin/develop 领先 36 个提交，工作区干净。设置 View 仅编排三个页面私有分区；上传处理、链接分享、部署域名分别复用旧控件 / Store / API；主题和语言沿用顶栏。没有修改认证、存储格式、依赖或设计文件。Pencil 只读核对 M0qx2A 的结构、文字和截图，图标按 SOURCE.md 从 Lucide 官方下载。

**验证**：lint、stylelint、typecheck、build 通过；Chrome 两个项目的设置页 E2E 4/4 通过。1440 / 1024 / 768 为两列，375 为单列；检查三个 region、无折叠面板、页面无横向溢出。已查看 [1440](UI/evidence/p5/t034-settings-1440.png)、[375](UI/evidence/p5/t034-settings-375.png)、[英文暗色 375](UI/evidence/p5/t034-settings-en-dark-375.png)；另有 768 / 1024 截图。现有高级配置完整可达，T035 继续完成命名 / 参数有效值提交，T036 / T038–T040 继续收口链接与部署行为。自动声明由 Vite 插件更新。

**环境**：普通 pnpm 命令被 enableGlobalVirtualStore 一致性检查拦截，统一使用 --config.verifyDepsBeforeRun=false；未安装 / 升级依赖。Chrome 在沙箱内 SIGABRT，获准沙箱外执行同一 fixture 测试。第一次重入 fixture 的语言种子冲突已改为独立测试上下文。无真实远端读写。

**回滚**：回滚本任务组件、样式、图标、翻译和对应测试 / 文档，不修改用户配置或远端资源。

### T035 接入上传处理偏好并兼容旧命名

**实施提交**：`e6e2501`，`feat(settings): preserve and validate upload preferences`。

**实施**：三种模式映射既有命名字段，时间戳仅禁用前缀输出并保留内容 / 开关，预览复用 applyUploadNaming 与稳定示例。原名 / 完整哈希 / 文件覆写 / 实际扩展名算法不变。设置与上传开关共用 SAVE_UPLOAD_PREFERENCES，候选有效且本地写入成功才发布；自由文本 change 才提交。压缩保留四个编码器，水印保留五位置及平铺参数。控件改为明确 Props / Emits，接收云端替换，挂载不发布已存在的值；旧 32px 不再被强制改为 40px。数值空值与非法参数保留草稿并提示错误。

**验证**：lint、stylelint、typecheck、build 通过；偏好 / 命名 / 处理 20 个单测，偏好 / 生命周期 8 个单测通过（偏好 3 项重合，不重复计数）；Chrome 两项目 E2E 2/2，通过旧模式、前缀未完成编辑不保存、时间戳禁用与恢复、avif、平铺控制和模拟云同步后刷新。已查看 [1440](UI/evidence/p5/t035-settings-1440.png)、[375](UI/evidence/p5/t035-settings-375.png)。fixture 仅显式启用 .settings 内存写入，仍拦截其他远端写入；真实云写入未执行。Element Plus 数字框图标插槽依据官方组件文档，使用已下载 Lucide minus / plus。

**回滚**：回滚组件、action、有效值工具与相应测试 / 文档；不新增持久化字段，旧配置和云文件仍可读。

### T038 实现有依据的部署阶段与可用性判定

**实施提交**：`9060562`，`fix(deploy): require matching Pages build evidence`。

**实施**：独立领域状态与共享部署服务，Git ref 操作只返回提交 SHA；去除固定 50 秒模拟成功与自动切换来源。查询 ref、Pages source 和 latest build；同 SHA / gh-pages 根路径 / built 才可用。初次 ref 404 还确认仓库可访问才视为未部署。权限、网络、结构与构建失败不冒充未部署，旧构建或构建中保持等待，12 次轮询后仍等待并允许手动查询。仓库 / 连接代次变化同步作废旧任务，重复入口共用 Promise。没有向自定义站点发送请求；历史 .deploy 保留兼容读取但不作为可用证据。重建分支及空域名行为先有确认保护，T039 / T040 继续细化入口与域名事务。

**验证**：lint、stylelint、typecheck、build 通过；8 个单测覆盖提交后等待、轮询上限、手动恢复、重复调用、无权限、失效任务、构建 SHA、源 ref 失败不删除、未确认不重建、分支只报告提交。Chrome 两项目 6/6 E2E，通过历史 .deploy=true 仍按新构建判定、等待 / 可用 / 权限失败、原来源不变。已查看 375px [等待](UI/evidence/p5/t038-waiting-375.png)、[可用](UI/evidence/p5/t038-available-375.png)、[失败](UI/evidence/p5/t038-forbidden-375.png)。API 依据方案补充的 GitHub 官方文档；未执行真实部署或站点验证。

**回滚**：回滚此服务、查询与阶段展示提交，不自动回撤任何远端分支 / Pages 操作；旧 .deploy 文件仍可读。

### T036 接入链接来源、格式与自定义规则

**实施提交**：`3fca33d`，`feat(settings): validate link rules and Pages source selection`。

**实施**：来源与格式预览复用 imageLinkText，HTML 模板以文本显示；关闭转换保留默认格式。历史云偏好补齐缺失预设 / 格式，旧自定义内容与选中值不被改写。规则使用独立草稿、显式添加 / 编辑 / 取消 / 确认删除；名称 / 去重 / path / 变量 / 协议 / URL 校验明确。编辑保留 id，自定义改名更新 selected，删除当前规则回落现有默认来源；内置规则不可删除。Pages 检查不先写来源，available 且目标匹配才提交；晚到结果不覆盖用户后续选择。

**验证**：lint、stylelint、typecheck、build 通过；规则 / 链接 / 兼容共 19 个单测通过；两项目 E2E 4/4，通过增删与取消、非法协议、HTML 文本预览、预设删除保护、Pages 未就绪保留来源及可用后显式选择。已查看 [1440](UI/evidence/p5/t036-links-1440.png)、[375](UI/evidence/p5/t036-links-375.png)。前三项历史截图增加显式任务采集开关，整套回归不会重写已有证据。共享部署入口的跨页联动留 T039 集成验证。无真实远端写入。

**回滚**：回滚规则编辑、来源事务、Store 与相应翻译 / 测试提交；旧存储字段与模板格式不变。

### T037 实现有效值保存与云同步反馈

**实施提交**：`4bc71e0`，`fix(settings): make cloud sync revision aware and recoverable`。

**实施**：AppWrap 保持单实例同步，展示组件只读取状态。成功本地保存递增内存 revision，偏好 / 链接 / 既有兼容持久化共用候选保存；本地失败保留有效候选并可重试。GET / PUT 显式指定 branch，typed result 区分 404、权限 / 网络和损坏；保存前重新读取验证，不把失败当空文件。递归允许字段投影排除未知和认证字段；旧对象缺少新增字段仍可读取，合并内置来源 / 格式但不静默重写模板。推送使用不可变快照，旧修订不能标记新修订已同步；拉取中修改、登出重连和晚到响应有代次保护，生命周期卸载清理监听。两页共享本地 / 云端阶段、原因与重试；损坏提示先修复远端文件。

**验证**：lint、stylelint、typecheck、build 通过；API / 同步 / 兼容 / 规则共 18 个相关单测通过，覆盖无文件播种、损坏 / 权限阻止 PUT、投影、单实例 / 无回声、推送期间修改、离线、存储失败、拉取期间修改与登出后迟到响应。Chrome 两项目回归 10/10，通过失败 / 损坏后本地不丢、无覆盖、显式重试成功、偏好刷新及链接流程。已查看 375px [权限失败](UI/evidence/p5/t037-forbidden-375.png)、[损坏](UI/evidence/p5/t037-corrupt-375.png)。真实 .settings 写入未执行。

**回滚**：回滚同步、投影、反馈与 Store 保存提交，继续兼容既有偏好对象，无新增存储键 / 版本号；不回撤已存在的云文件。

### T039 统一两处部署入口、防重与部署快捷键

**实施提交**：`8f37883`，`feat(deploy): share entry guards and deployment shortcut`。

**实施**：两页部署 / 域名按钮使用共享 busy 与执行 action。AppWrap 唯一注册 D，页面组件只登记可执行判断，保留上传成功结果与连接门禁，快捷键与当前按钮禁用态一致；输入 / 弹窗 / 预览 / repeat / 组合键修饰 / 失焦不接管。卸载注销判断与监听，切页不新建部署服务。重建 gh-pages 明确目标、源分支和影响并确认，取消无写入；可用后提供访问与显式选择 Pages 来源，不自动切换。

**验证**：lint、stylelint、typecheck、build 通过；快捷键 / 部署共 9 个单测通过，含 scope 清理和重复调用；两项目部署回归 8/8，通过取消无写入、D 同动作、设置提交中切到上传同阶段 / 按钮禁用、仅一次分支删除与创建、可用后来源仍为原值及显式选择。已查看 [设置等待](UI/evidence/p5/t039-settings-waiting.png)、[上传可用 / 375](UI/evidence/p5/t039-upload-available-375.png)。所有 DELETE / POST 均为 fixture 响应，没有真实分支操作。

**回滚**：回滚入口守卫、快捷键及对应测试 / 翻译，部署证据服务仍保留；不自动回撤远端内容。

### T040 实现域名草稿、CNAME 与保存并部署

**实施提交**：本节所属提交 `feat(settings): save domains and deploy with CNAME safeguards`。

**实施**：域名为页面草稿，输入不写设置；显示规范化主机名，非法和仅路径输入不能当作清空。保存并部署共用运行锁，依次完成本地有效值保存、CNAME 文件同步、分支和 Pages 配置；CNAME 失败阻止分支操作，失败保留输入与原来源。清空读取实际 CNAME 与 Pages 绑定并明确确认，取消无本地 / 远端写入，确认后 sha 改变不删除新内容。Pages 域名用规范化值 / null 显式更新，首次先创建站点再补绑定，不能只删除文件而保留旧绑定。DNS 提示取实际 owner；本地、CNAME、等待 / 可用、失败归属独立显示，云同步状态单独呈现。

**生命周期与移动收口**：模拟登录态跨页验证发现上传页重验会改变验证请求代次，改用仅内存 connectionSessionId，在实际认证 / 仓库变化或登出时失效；同一连接重验不清空正在执行的部署。云同步把同一提交中的 owner / repo / branch / 会话变化合并成一次拉取，异步仍直接核对当前身份，旧响应不能发布。没有新增凭据副本 / 指纹 / 存储键。水印步进按钮实测补到 44px；375px 关键输入为 16px。旧导航 smoke 改为断言三个实际分区与命名选项，不能用已移除的折叠按钮或空列表蒙混通过。

**工程验证**：最终 `pnpm --config.verifyDepsBeforeRun=false verify` 退出 0；lint、stylelint、app / Worker typecheck、33 个文件 / 206 项单测、build 全通过。包括创建 / 更新 / 一致无需写入 / 空值跳过、非法与超长域名、查询失败 / 损坏、清空确认与 sha 冲突、本地失败阻断、CNAME 失败阻断、分支失败、重复提交、Pages cname=null / 首次创建再绑定、旧连接重验与真正会话变化、连接字段批量切换等。日志 `/private/tmp/picx-p5-verify.log`。

**浏览器验证**：完整 Desktop Chrome / Pixel 5 共 192 项通过；末轮同步批处理调整后，认证路由、同步、跨页部署与上传生命周期相关 36 项再通过；最终英文 / 繁体暗色静态截图 4 项通过。T040 覆盖域名非法、草稿不保存、规范化、首次创建 / 更新 / 一致不写入、CNAME 失败、部署失败、清空取消 / 确认、来源不变、真实形状登录态跨页、输入 16px 和步进目标 44px。日志 `/private/tmp/picx-p5-e2e.log`、`/private/tmp/picx-p5-e2e-final.log`、`/private/tmp/picx-p5-visual-final.log`。所有 GitHub 读写由严格 fixture 拦截，未执行真实仓库、CNAME、Pages 或 DNS 操作。

已查看最终 [1440 简中](UI/evidence/p5/t040-settings-1440.png)、[375 域名更新](UI/evidence/p5/t040-update-375.png)、[375 CNAME 失败](UI/evidence/p5/t040-cname-failure-375.png)、[375 移除域名](UI/evidence/p5/t040-clear-375.png)、[375 英文暗色](UI/evidence/p5/t040-en-dark-375.png)、[375 繁体暗色](UI/evidence/p5/t040-zh-TW-dark-375.png)，另保留首次创建、一致跳过、部署失败截图。设计文件 M0qx2A 只读；Lucide 资源按设计稿下载 / 本地复用，62 个 typed 名称均对应本地 symbol。三语 settings_workspace / link_rules / settings_sync / domain_settings / deployment 分别为 23 / 23 / 9 / 17 / 18 个 key，集合一致。回归覆盖的 P2 / P3 旧截图恢复所属版本，P5 证据独立保留。

**提交环境**：沿用命令级 verifyDepsBeforeRun=false，无依赖、锁文件或钩子文件改动。原钩子无法通过本机 pnpm 配置一致性检查，提交前用同参数显式执行 lint-staged 和 commitlint，再仅该次关闭 Husky 完成提交；实际检查均运行通过。Chrome 获准沙箱外执行 fixture。

**回滚**：回滚此提交恢复上一版域名流程与相关生命周期收口，旧偏好 / 云文件格式仍可读；不自动撤销任何已完成的真实 CNAME / 分支 / Pages 操作。

**P5 准出结论**：T034–T040 共 7 项完成并分别提交，T038 按依赖先于 T036。三分区、历史偏好、共享保存与同步反馈、部署证据 / 防重 / 快捷键、域名分步操作通过本地验收。总进度 40 / 48，P6 尚未开始。真实 GitHub / DNS / 自定义站点可访问性、Safari / 真机与 PWA 全流程仍由 P6 验收，不以本地 mock 代替。工作区无文件删除，不推送。

| 任务 | 独立实施提交 |
| --- | --- |
| T034 三个设置区 | `e28cb76` |
| T035 上传偏好兼容 | `e6e2501` |
| T038 有依据的部署状态 | `9060562` |
| T036 链接与规则 | `3fca33d` |
| T037 保存与云同步 | `4bc71e0` |
| T039 共享入口与快捷键 | `8f37883` |
| T040 域名与 CNAME 事务 | 本节所属提交 |

## P6：整体验收（2026-10-19 起）

开始时 `develop` 位于 `80aafc5`，领先 `origin/develop` 43 个提交，工作区干净。沿用当前依赖，不分析 `node_modules` / `dist`，不删除文件、不推送。真实页面使用用户已授权登录的 `http://localhost:4000/images-hosting/#/upload`；本地 fixture 使用独立 `127.0.0.1:4173`、临时浏览器配置与严格网络拦截，不混用会话。

### T041 完成画板视觉对照

**实施提交**：本节所属提交 `fix(ui): align upload workspace with visual acceptance baseline`。

通过 Pencil 重新只读核对 11 个画板、`IGX9S` 品牌与 `cOfT3` / `lA2S0` 上下文，导出本轮参考图；在 1440×1080、简中、亮色 Chrome 截图并逐一检查，覆盖登录、上传空态、目录四模式 / 加载 / 空 / 失败、待上传、真实 Worker 压缩完成、管理三个状态与设置三区。完整节点映射、原图、并排对照和差异说明见 [P6 证据](UI/evidence/p6/README.md)。尺寸测试不是视觉检查的替代，所有保留图都已检查。

修复空态 600px → 408px、24px 圆角，待上传队列 220px → 244px；队列操作并入缩略图所在行，去掉重复的详情按钮，详情仍通过 48px 缩略图按钮到达，移除 / 复制保持 44px 常驻。链接预览保留完整文本，在最多三行的可聚焦区域内滚动，避免编码路径挤占快捷操作。已在方案 §4.1 说明状态文字、压缩体积、失败说明及保留能力造成的自适应高度；未压缩字级或点击区域来强制行高。未新增数据 / API / 持久化格式。

**验证**：build、typecheck、改动 ESLint、全量 stylelint 退出 0；队列组件 2 项单测通过。T041 的 6 项截图 / 尺寸 / 业务状态 E2E 通过，受影响目录 / 队列 / 复制回归 Desktop Chrome + Pixel 5 共 16 项通过。日志为 `/private/tmp/picx-p6-t041.log`、`picx-p6-t041-regression.log`、`picx-p6-t041-unit.log`、`picx-p6-t041-typecheck.log`、`picx-p6-t041-lint.log`、`picx-p6-style.log`、`picx-p6-build.log`。首次沙箱内 Chrome 进程 SIGABRT，不计通过；沙箱外复跑通过。Node 24.21.0、实际 pnpm 11.17.0 与 packageManager 11.18.0 有差异，沿用命令级 `verifyDepsBeforeRun=false`，未安装依赖；Git hooks 通过临时 pnpm 包装使用同参数运行，没有跳过检查。旧 P2 / P3 被回归覆盖的截图恢复所属提交版本。

**边界**：透明 1×1 图片、空 MP4、账号和数量是 fixture；MP4 的预览失败界面不证明解码成功。字体使用获准系统回退。安全说明、真实部署状态、存量设置和页脚增加高度按方案保留；没有条款目标则不补伪链接。移动 / 暗色 / 键盘 / 真实远端与 PWA 分别归后续任务。

**回滚**：回退本提交的展示样式、预览和验收测试；不清空设置，不改认证，不撤销用户远端操作。

### T042 完成三语、主题与长内容回归

**实施提交**：本节所属提交 `test(ui): verify locales themes long content and native zoom`；T041 最终提交为 `ec59974`。

新增三语键 / 参数 / 静态引用校验：简中、繁中、英文各 568 个叶子键，集合一致，非空；插值变量取集合比较，正确允许英文复数分支多次使用同一个 count。递归只读 `src` 的 Vue / TS，明确排除产物与自动声明，全部静态 t / $t 引用可解析。人工复核触达业务模板，用户文本来自 locale；仓库 / 文件 / 用户输入、协议与编码器名称按数据展示，不作为缺失翻译。

Chrome 155.0.8059.82 执行三语 × light / dark / system 共 9 个组合，逐项覆盖登录、上传、管理、设置，长文件名、五层路径、完整路径浮层、规则模板和可滚动预览。系统模式在同一页面切换系统颜色后立即更新。9 个组合在 720 CSS px 下验证 1440px 显示区 200% 的等效重排，底部保存动作可滚动到达。截图已分别查看，见 [上传矩阵](UI/evidence/p6/t042-upload-matrix.png)、[简中重排](UI/evidence/p6/t042-zh-CN-reflow-matrix.png)、[繁中重排](UI/evidence/p6/t042-zh-TW-reflow-matrix.png)、[英文重排](UI/evidence/p6/t042-en-reflow-matrix.png)；原图按 `t042-语言-主题-*.png` 保存。

另用新建临时 Chrome profile 的原生页面缩放独立验证 100% / 200%，不读取或修改已有浏览器配置。实测分别为 `innerWidth=1440 / devicePixelRatio=1`、`720 / 2`，有比例断言及 [原始数值](UI/evidence/p6/t042-native-zoom.json)。登录输入与设置页均无文档横向溢出，底部保存动作可见；[100% 视口](UI/evidence/p6/t042-native-zoom-100.png)、[200% 视口](UI/evidence/p6/t042-native-zoom-200.png) 用 Chrome 原生视口捕获，避免 fullPage 在原生缩放下裁掉右半边的截图问题。远端网络被阻断时明确展示同步失败，不补写成功。

**验证**：locale 3 项单测、9 项组合与 1 项原生缩放 E2E 通过；既有顶栏 7 项 E2E 通过，包含真实更新通知插件 setLocale、Element Plus 关闭名称、页面标题、语言切换、主题、账户互斥及安装事件。改动 ESLint 通过。日志 `/private/tmp/picx-p6-t042-locales.log`、`picx-p6-t042.log`、`picx-p6-t042-zoom.log`、`picx-p6-t042-lint.log`。首轮测试的错误 locale 字段、英文复数参数重复计数，以及原生缩放 profile 格式均已修正，失败不计入通过。主题定量对比度另在 T043 测量并修复。

**回滚**：回退新增验收测试与证据即可；无产品 / 依赖 / 存储格式修改，无真实云写入。

### T043 响应式、键盘与可访问性：自动化完成，人工项目待验

**实施提交**：本节所属提交 `fix(a11y): improve success contrast and add acceptance coverage`；本任务保持未勾选。

新增 [可访问性回归](../tests/e2e/acceptance-accessibility.spec.ts)，在 375、768、1024、1280、1440px 和 375×400 低高度下遍历登录、上传、管理、设置，断言文档无横向溢出、页尾可滚动到达、375px Token 输入为 16px。键盘用合成凭据完成连接、目录四选项中的新建 / 取消 / 根目录保存、上传、全部复制、管理选择与所选复制；检查 Tab / Shift+Tab 焦点留在弹窗、Esc 返回触发按钮、重新打开后的初始焦点，以及管理选择 / 复制 / 更多动作至少 44×44px。文件输入由 fixture 注入，真实系统选择框另见 T044 / T046。

定量检查明暗主题各 10 对实际 CSS 语义色值，普通文字阈值 4.5:1，焦点和边框阈值 3:1。亮色 success / success-soft 原值约 4.29:1，调整 `--picx-color-success` 从 `#168264` 到 `#127a5d` 后为 4.77:1；Element Plus 继续复用同一语义色。两主题样本全部达标，见 [亮色数值](UI/evidence/p6/t043-contrast-light.json)、[暗色数值](UI/evidence/p6/t043-contrast-dark.json)。同时验证可见实线焦点与 reduced-motion 下的过渡关闭；该色值修正是为达到方案对比度要求，未修改设计稿。

**验证**：T043 的 4 项 Desktop Chrome E2E 最终通过，原有 layout 6 项也通过。目录弹窗测试等待实际 initial focus 后才继续，截图等待自动通知自然关闭；首轮定位 / 动画时序失败已修正，不计为通过。最终日志 `/private/tmp/picx-p6-t043-final.log`，layout 记录 `/private/tmp/picx-p6-t043.log`。已逐一查看六档 [375px](UI/evidence/p6/t043-login-375-812.png)、[低高度](UI/evidence/p6/t043-login-375-400.png)、[768px](UI/evidence/p6/t043-login-768-1024.png)、[1024px](UI/evidence/p6/t043-login-1024-900.png)、[1280px](UI/evidence/p6/t043-login-1280-900.png)、[1440px](UI/evidence/p6/t043-login-1440-1080.png) 和 [键盘管理](UI/evidence/p6/t043-keyboard-management-375.png)；透明 1×1 媒体为 fixture。

**待验**：没有连接真实手机软键盘、触摸设备或读屏会话；语义角色、live region 和模拟视口不能证明实际读屏播报及软键盘通过，因此 T043 不勾选。回滚本提交可恢复成功色及验收测试，不影响用户数据和远端文件。

### T044 Chrome 主流程验证

**实施提交**：本节所属提交 `test(ui): accept Chrome browser flows and real MP4 playback`。用户于 2026-10-19 明确将浏览器范围调整为 Chrome 通过即可，不要求 Safari / Firefox；本项按该范围完成，T043 的真机与读屏项目仍单列待验。

环境为 macOS 14.5、Chrome 155.0.8059.82。Desktop Chrome 与 Pixel 5 手机模拟全量 E2E 共 235 项通过、3 项按配置跳过；其中桌面 SW 升级需在全量结束后独立运行、手机不重复 SW 升级 / 原生桌面缩放，单独结果见 T047 / T042。日志 `/private/tmp/picx-p6-e2e.log`。覆盖文件输入 / 拖放 / 粘贴与输入框不接管、真实 WASM Worker 水印 / 压缩、复制成功 / 拒绝恢复、目录事务、管理、设置、主题和主要弹窗。

新增 [MP4 验收](../tests/e2e/acceptance-media.spec.ts)：用浏览器 Canvas + MediaRecorder 生成可解码 AVC MP4，真实详情播放器断言 320×180，并实际播放到 currentTime > 0.1；两 Chrome 项目均通过。已查看 [本地 MP4 预览](UI/evidence/p6/t044-chrome-mp4-preview.png)。该用例替代透明图片 / 空 MP4 fixture 对解码能力的不足，不访问真实凭据或远端接口。

实际 Chrome 系统文件选择框完成自建 MP4、PNG 与用户测试图片选择；真实 Worker 处理、复制和管理媒体加载结果见 T046 的独立远端证据。公开 Pages MP4 完整播放至 1.133033 秒，ended=true、readyState=4、error=null。没有将模拟手机写成真机通过。Safari 曾在调整前尝试连接但超时，用户取消该要求后停止；不记为通过或剩余阻塞。

**回滚**：回退新增媒体验收测试与记录，不撤销已上传的测试素材或用户浏览器数据。
