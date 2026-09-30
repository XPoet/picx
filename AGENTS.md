# AI 协作规则

## 当前项目事实

PicX 当前是一个纯前端 Vue 3 单页应用，采用 Hash 路由并以静态资源形式部署。主要能力包括：

- GitHub OAuth 或 Token 登录。
- 基于 GitHub REST API 的仓库初始化、图片上传、目录浏览、图片管理和 GitHub Pages 部署。
- 图片压缩、图片转 Base64、图片水印。
- PWA、明暗主题、简体中文、繁体中文和英文。

当前主要技术：

- Vue 3、Vue Router、Vuex、Vue I18n。
- Vite、TypeScript、Element Plus。
- Stylus、unplugin 自动导入、Iconify 图标。
- Axios、vite-plugin-pwa。

版本事实以 `package.json` 和 `pnpm-lock.yaml` 为准。不得只看版本范围后宣称已安装某个版本。

## 目录职责

```text
src/
├── common/                 # API、常量、指令和共享领域模型
├── components/             # 跨页面组件及现有图片工具组件
├── locales/                # zh-CN、zh-TW、en 翻译资源
├── plugins/
│   ├── vite/               # Vite 构建插件配置
│   └── vue/                # Vue 运行时插件配置
├── router/                 # 路由定义和页面标题守卫
├── stores/                 # Vuex 根 Store 与业务模块
├── styles/                 # 全局 Stylus 变量、主题和基础样式
├── utils/                  # 图片、上传、请求、存储和系统工具
└── views/                  # 路由级页面与页面私有组件
```

注意：当前 `src/plugins/` 是框架集成目录，不是图片工具插件系统。插件平台改造以 `docs/PLUGIN-PLATFORM-REFACTOR-PLAN.md` 为准。

## 强制安全约束

- 禁止输出、记录或提交 GitHub Token、OAuth code、环境变量值及其他凭据。
- `.env.development`、`.env.production` 中只能提交可公开的 Vite 客户端配置；任何 `VITE_*` 值都会暴露在浏览器产物中。
- GitHub Token 当前会进入浏览器存储。涉及认证或存储改造时，必须先更新安全设计，不得扩大 Token 的暴露面。
- 禁止给不受信任的内容使用 `dangerouslyUseHTMLString` 或 `v-html`。必须显示富文本时，先进行可信来源判定和内容清洗。
- 引入远程插件、远程脚本或第三方统计脚本时，必须同时评估 CSP、SRI、权限、隐私和失效降级。

## 修改前工作流

1. 执行 `git status --short --branch`，识别已有改动。
2. 使用 `rg` 和 `rg --files` 定位代码，明确排除目录。
3. 阅读调用链，不允许只改表层组件：
   - 页面入口。
   - 路由。
   - Store。
   - API 或图片处理服务。
   - 持久化。
   - 多语言和样式。
4. 对非微小改动给出组件或模块边界图。
5. API、数据结构、插件契约或持久化格式变更时，先更新对应文档，再修改代码。
6. 大版本升级、Vuex 到 Pinia、插件化、UI 重构必须分阶段完成；每一阶段均应可独立验证和回滚。

## Vue 与 TypeScript 规则

- 新代码默认使用 Vue 3 Composition API、`<script setup lang="ts">`。
- 路由级 View 只负责页面编排，不承载多个独立业务区的全部实现。
- 组件遵循 Props Down、Events Up；禁止直接修改 Props。
- 公共组件必须定义明确的 `defineProps`、`defineEmits` 或 `defineModel` 类型契约。
- 可复用、有状态或具有副作用的逻辑提取为 `useXxx` composable；纯函数保留在 `utils` 或领域服务中。
- 派生状态使用 `computed`；`watch` 只用于副作用。
- 外部库实例、大对象或按引用替换的状态优先评估 `shallowRef`，避免不必要的深层代理。
- 列表必须使用稳定业务键，禁止把数组下标作为唯一键。
- 新增模板引用时，目标 Vue 版本支持的情况下优先使用 `useTemplateRef`。
- 禁止新增 `any`、`@ts-ignore` 或非空断言来掩盖类型问题；确需使用时必须写明边界原因。
- 不得手工把业务代码塞进 `src/auto-imports.d.ts` 或 `src/components.d.ts`。它们是自动生成文件，只能由构建插件更新。

## 当前架构边界

- `src/common/api/` 只表达 GitHub API 操作，不应直接负责页面状态。
- `src/utils/request/` 负责 HTTP 客户端与统一错误转换。
- `src/stores/` 负责跨页面状态；页面临时 UI 状态应留在页面或 composable。
- `src/utils/` 不得反向依赖具体 View。现有反向依赖属于待拆分技术债，不得继续扩大。
- GitHub 图床逻辑不得继续散落到通用 UI、通用 Store 和图片工具组件中。
- 图片压缩、水印等算法必须与 UI 解耦，接收明确输入并返回明确结果。
- 图片文件、Base64、对象 URL 和处理结果必须有统一资产模型，并明确释放对象 URL 的生命周期。

## 插件平台规则

涉及图片工具平台改造时，遵守以下边界：

- Shell 只能依赖插件契约，不直接依赖具体插件实现。
- 插件不得直接导入 Shell 的 Store、Router 实例、Axios 单例或内部组件。
- 插件通过受限 `PluginContext` 获取路由、通知、存储、任务队列、剪贴板、下载和网络能力。
- 每个插件必须提供稳定、可序列化的 manifest，至少包含 `id`、`version`、`nameKey`、`descriptionKey`、`icon`、`entry`、`capabilities` 和 `permissions`。
- 每个插件必须实现显式生命周期：加载、激活、停用、释放。
- 内置插件允许同线程可信加载；第三方不受信任插件不得直接在主页面执行，应使用 sandboxed iframe 或 Web Worker，并通过类型化消息协议通信。
- 热停用必须撤销路由、命令、菜单、事件监听、Worker、对象 URL 和其他副作用。
- ESM 模块加载后不能真正从浏览器内存卸载，文档和 UI 不得把“停用”描述为“代码已物理卸载”。
- 图床插件可通过能力依赖复用压缩或水印插件，禁止复制算法实现。
- 插件新增或契约变更时，必须同步更新 `docs/PLUGIN-PLATFORM-REFACTOR-PLAN.md`、多语言资源和测试。

## UI 与可访问性规则

- UI 改造以 `docs/UI-REDESIGN-SPEC.md` 为产品与视觉基线。
- 保留 PicX 的蓝色品牌识别，但通过语义 Token 管理颜色，组件内禁止新增散落的原始色值。
- 所有图标来自同一图标体系，不使用 Emoji 作为结构性图标。
- 桌面、平板、手机均需明确布局；最低验证宽度为 375px。
- 正文默认不小于 14px，移动端关键输入不小于 16px。
- 点击或触摸目标不小于 44×44px。
- 所有交互支持键盘，图标按钮必须有可访问名称，焦点样式不可移除。
- 普通文本对比度至少 4.5:1，大文本和 UI 图形至少 3:1。
- 动画优先使用 `transform` 和 `opacity`，时长通常为 150–300ms，并支持 `prefers-reduced-motion`。
- 加载、空状态、失败、离线、无权限和部分成功必须有明确反馈及恢复操作。
- 禁止通过 Hover 才暴露唯一的关键操作。

## 国际化规则

- 面向用户的新文本必须进入 `src/locales/zh-CN.json`、`src/locales/zh-TW.json`、`src/locales/en.json`。
- 禁止在模板或业务逻辑中硬编码面向用户的中文或英文。
- 同一概念的 key 应保持命名一致，插件翻译建议使用 `plugins.<pluginId>.*` 命名空间。
- 修改语言切换逻辑时，必须同时验证 Element Plus locale、页面标题和更新通知 locale。

## 依赖与构建规则

- 使用 pnpm，不得混用 npm 或 yarn 更新锁文件。
- 引入依赖前说明：用途、体积、维护状态、许可证、浏览器兼容性和可替代方案。
- 禁止导入依赖包的未公开深层路径。现有压缩库的深层导入属于必须在升级中消除的风险。
- Vite、TypeScript、ESLint、Vue Router、Vue I18n 等跨大版本升级必须按 `docs/TECH-STACK-UPGRADE-PLAN.md` 分阶段执行。
- PWA 变更必须验证 manifest、Service Worker 更新、离线回退和旧缓存升级。
- CI 与本地必须使用同一包管理器和受支持的 Node.js LTS。

当前脚本：

```bash
pnpm dev
pnpm build
pnpm lint
pnpm lint:style
pnpm format
```

当前项目没有正式的 `typecheck`、单元测试或端到端测试脚本。未新增这些脚本前，不得声称相关检查已通过。
