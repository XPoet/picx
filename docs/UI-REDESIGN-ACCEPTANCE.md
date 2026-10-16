# PicX · UI 改造验收记录

记录日期：2026-10-16。任务依据：[执行清单](UI-REDESIGN-TASKS.md)；产品与契约依据：[改造方案](UI-REDESIGN-SPEC.md)。完成状态只在执行清单中勾选。本记录分别说明源码核对、自动检查、页面证据和真实远端结果，不互相替代。

## P0 基线与契约

### T001 核对设计画板与存量功能

**实施提交**：`docs(ui): inventory redesign boards and existing capabilities`（本节所属提交，可按提交标题定位）。

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
