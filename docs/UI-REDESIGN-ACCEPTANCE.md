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
| 图片 / MP4 预览、属性、复制、重命名、移动、删除 | 管理卡片 / selector / 右键指令 → `image-card.util.ts` / `repo-content-utils.ts` → GitHub API → 缓存 | 卡片常驻动作与更多菜单；右键作为附加入口，T032–T033 |
| 目录重命名、递归删除、媒体移动 | `folder-card.util.ts` / 移动弹窗 → `repo-content-utils.ts` → tree / commit / ref → Store | 文件夹更多菜单与明确确认；保留递归影响说明，T030、T033 |
| 原名 / 哈希 / 时间戳 / 前缀 | `/settings` → `UserSettingsModel.imageName` → 上传对象生成 | 三种命名选项映射旧字段；原名兼容、时间戳互斥，T024、T035 |
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

**实施提交**：`docs(ui): record engineering and page baselines`（本节所属提交，可按标题定位）。应用源码基于 `15450d4`，P0 前三项只有文档变化。

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
