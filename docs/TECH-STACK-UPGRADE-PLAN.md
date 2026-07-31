# PicX 技术栈升级方案

## 1. 目标与原则

本文给出从当前 2023～2024 年技术基线升级到 2026-07-31 最新官方文档基线的实施方案。

升级目标不是一次性修改所有版本号，而是：

1. 先建立可重复的构建、类型检查和测试门禁。
2. 逐层升级运行环境、框架、构建、规范和图片处理依赖。
3. 每一步只引入一类变量，失败时可以定位和回滚。
4. 最终为插件平台和 UI 重构提供稳定、受支持的基础。

“最新”分为两种：

- npm 注册表最新稳定版：用于记录版本事实。
- PicX 建议目标版：必须同时满足 Vue、Volar、Vite 插件和 CI 的兼容要求。

两者不一致时，以官方兼容性说明和可验证性为准，并在表格中明确原因。

## 2. 当前基线

以下当前版本来自 `pnpm-lock.yaml` 对应的解析结果，而不只是 `package.json` 的范围：

| 类别                 | 当前版本                        |
| -------------------- | ------------------------------- |
| Node.js CI           | 16，已停止支持                  |
| 包管理器声明         | pnpm 7.33.7                     |
| Vue                  | 3.3.4                           |
| Vue Router           | 4.2.4                           |
| Vuex                 | 4.1.0                           |
| Vue I18n             | 9.2.2                           |
| Element Plus         | 2.3.7                           |
| Axios                | 1.4.0                           |
| Vite                 | 2.7.13                          |
| `@vitejs/plugin-vue` | 2.3.4                           |
| TypeScript           | 4.9.5                           |
| ESLint               | 7.32.0                          |
| Prettier             | 2.8.8                           |
| Stylelint            | 15.10.2                         |
| Stylus               | 0.59.0                          |
| vite-plugin-pwa      | 0.12.8                          |
| 图片压缩             | `@yireen/squoosh-browser` 1.0.7 |

当前缺失：

- `typecheck` 脚本。
- 单元测试。
- Vue 组件测试。
- 端到端测试。
- CI 中的 lint、类型和测试门禁。
- Node 和 pnpm 版本文件。

## 3. 2026-07-31 版本事实与建议目标

版本通过 npm 官方注册表 `pnpm outdated`、`pnpm view` 和官方迁移文档核验。

### 3.1 运行时与核心框架

| 包／运行时   |              npm 或官方最新 |      PicX 建议目标 | 决策                                   |
| ------------ | --------------------------: | -----------------: | -------------------------------------- |
| Node.js      | 26.5.0 Current；24.18.0 LTS |           24.x LTS | CI 与本地统一使用 LTS，不追 Current    |
| pnpm         |                     11.18.0 |            11.18.0 | 需要 Node.js ≥22.13                    |
| Vue          |                      3.5.40 |             3.5.40 | 3.5 是无破坏性小版本，适合作为平台基线 |
| Vue Router   |                       5.2.0 |              5.2.0 | 手写路由从 v4 升 v5 无破坏性修改       |
| Vuex         |                       4.1.0 | 迁移到 Pinia 4.0.2 | Vuex 保持冻结，仅作为迁移期兼容层      |
| Vue I18n     |                      11.4.8 |             11.4.8 | 必须先迁出 Legacy API，为 v12 做准备   |
| Element Plus |                      2.14.3 |             2.14.3 | 保留组件库，重做 Token 和封装层        |
| Axios        |                      1.19.0 |             1.19.0 | 先升级，后续由平台 HttpClient 隔离     |

### 3.2 构建与类型

| 包                      | npm 最新 |          PicX 建议目标 | 决策                                                 |
| ----------------------- | -------: | ---------------------: | ---------------------------------------------------- |
| Vite                    |    8.2.0 |                  8.2.0 | 经 Vite 5、Vite 7／rolldown-vite 分段迁移            |
| `@vitejs/plugin-vue`    |    6.0.8 |                  6.0.8 | 与 Vite 8 配套验证                                   |
| TypeScript              |    7.0.2 |                  6.0.x | TypeScript 官方明确指出 Vue／Volar 暂时依赖 TS 6 API |
| `vue-tsc`               |    3.3.8 |                  3.3.8 | 作为 `.vue` 正式类型检查器                           |
| Terser                  |   5.49.0 |          5.49.0 或移除 | Vite 8 默认压缩足够时优先移除额外 Terser             |
| vite-plugin-pwa         |    1.3.0 |                  1.3.0 | peer 已覆盖 Vite 8                                   |
| unplugin-auto-import    |   21.0.0 |                 21.0.0 | 必须验证 d.ts 生成和 ESLint 集成                     |
| unplugin-vue-components |   32.1.0 |                 32.1.0 | 必须验证 Element Plus Resolver                       |
| unplugin-icons          |   23.0.1 |                 23.0.1 | 配合统一图标体系                                     |
| `@iconify-json/ep`      |    1.2.4 | 保留或改为单一新图标集 | 由 UI 方案最终决定                                   |

### 3.3 工程质量

| 包                        | npm 最新 |        PicX 建议目标 | 决策                                                                              |
| ------------------------- | -------: | -------------------: | --------------------------------------------------------------------------------- |
| ESLint                    |   10.8.0 |               10.8.0 | 切换 Flat Config                                                                  |
| `@antfu/eslint-config`    |    9.2.0 |                9.2.0 | 统一提供 TypeScript、Vue、Import 和 Stylistic Flat Config，避免手工组合多套插件   |
| eslint-config-airbnb-base |   15.0.0 |                 移除 | 配置老化，阻碍 Flat Config 与 ESLint 10                                           |
| eslint-plugin-prettier    |    5.5.6 |                 移除 | 不再叠加第二套格式规则                                                            |
| Prettier                  |    3.9.6 |                 移除 | 按用户决策由 `@antfu/eslint-config` 的 Stylistic 规则统一格式化                   |
| Stylelint                 |  17.14.1 |              17.14.1 | 配套最新 Stylus 解析                                                              |
| stylelint-stylus          |    1.0.0 |                 移除 | 其 peer 仅支持 Stylelint 13～16，与 Stylelint 17 不兼容；改用 `postcss-styl` 解析 |
| stylelint-config-standard |   40.0.0 |               40.0.0 | 替代老旧属性顺序配置的基础规则                                                    |
| Stylus                    |   0.64.0 | 0.64.0，后续逐步退出 | 先兼容升级，不与 UI 重构同时换预处理器                                            |
| Husky                     |    9.1.7 |                9.1.7 | 更新 hook 安装方式                                                                |
| lint-staged               |   17.2.0 |               17.2.0 | 只检查暂存文件                                                                    |
| Commitlint CLI            |   21.2.1 |               21.2.1 | 配套新 Node                                                                       |
| Commitlint conventional   |   21.2.0 |               21.2.0 | 更新配置格式                                                                      |

### 3.4 测试工具

| 包                | 最新版本 | 用途                                          |
| ----------------- | -------: | --------------------------------------------- |
| Vitest            |   4.1.10 | composable、服务、算法和 Store 单元测试       |
| `@vue/test-utils` |   2.4.11 | Vue 组件交互测试                              |
| Playwright        |   1.62.1 | 登录替身、工具工作区、响应式和 PWA 端到端测试 |
| `vue-tsc`         |    3.3.8 | SFC 与模板类型检查                            |

## 4. 关键兼容性结论

### 4.1 TypeScript 7 暂不作为 Vue 唯一编译器

TypeScript 7.0.2 已经是 npm `latest`，但其原生 Go 实现暂未提供完整稳定的程序化 API。TypeScript 官方明确指出 Vue、MDX、Astro、Svelte 等依赖嵌入式语言服务的工具暂时需要继续使用 TypeScript 6.0。

PicX 的生产建议：

- `typescript` 固定在最新 `6.0.x`。
- `vue-tsc` 使用 3.3.8。
- 先消除 TypeScript 6 的所有弃用选项。
- 待 TypeScript 7.1+ 提供稳定 API，且 Volar／vue-tsc 官方确认支持后再切换。
- 如需评估 TypeScript 7，只能建立非阻塞实验任务，不得取代 Vue SFC 类型门禁。

当前 `tsconfig.json` 需要重点处理：

- 删除或替代将被 TypeScript 7 移除的 `baseUrl` 使用。
- 显式设置 `rootDir`。
- 显式列出 `types`。
- 使用适合 Bundler 的 module resolution。
- 将应用配置与 Node 构建配置拆成多个 tsconfig。

### 4.2 Vite 8 必须经过 Rolldown 兼容验证

Vite 8 从 Rollup／esbuild 双链路切换到 Rolldown／Oxc，是 Vite 2 到 Vite 8 之间最大的底层变化。

当前 PicX 的风险点：

- `@yireen/squoosh-browser` 的 WASM 和深层路径导入。
- `optimizeDeps.exclude`。
- Terser 自定义压缩。
- 自动导入、图标、更新通知、PWA 多个 Vite 插件。
- Stylus 全局 `imports` 与 `additionalData`。
- `vite.config.ts` 中 CommonJS 风格的 `__dirname` 和 `path` 使用。

因此采用官方推荐的渐进路径：

```text
Vite 2 → Vite 5 → Vite 7 → rolldown-vite 7 → Vite 8
```

每一步都执行同一套构建与浏览器冒烟，先隔离常规大版本问题，再隔离 Rolldown 问题。

### 4.3 Vue I18n 必须转 Composition API

当前代码使用：

- `instance.proxy.$i18n.locale`。
- `instance.proxy.$t`。
- `i18n.global.t`。
- 默认 Legacy 模式。

Vue I18n 11 已弃用 Legacy API，并将在 v12 移除。升级前应：

1. `createI18n` 设置 `legacy: false`。
2. 对暂时依赖模板 `$t` 的页面设置并验证 `globalInjection`。
3. 新代码使用 `useI18n()`。
4. locale 改为响应式 `i18n.global.locale.value`。
5. 为三份 locale 增加 key 一致性测试。

### 4.4 Vuex 到 Pinia 可以并行迁移

Pinia 官方允许 Vuex 与 Pinia 在迁移期共存。PicX 应一模块一模块迁移，避免大爆炸替换：

1. `toolbox-image-list`。
2. `upload-image-list`。
3. `upload-area`、`image-card`。
4. `deploy-status`。
5. `user-settings`。
6. `dir-image-list`。
7. `github-authorize`、`user-config-info`。
8. 最后移除 Vuex 根 Store。

插件平台相关的新状态直接使用 Pinia，不再新增 Vuex 模块。

## 5. 分阶段升级计划

### 阶段 0：冻结行为基线

目标：在升级前把现有行为变成可验证契约。

任务：

- 记录当前 `pnpm build` 结果、产物入口和主要 chunk。
- 增加 `typecheck`，先记录存量错误，不允许通过 `skipLibCheck` 或 `@ts-ignore` 全局掩盖。
- 引入 Vitest、Vue Test Utils 和 Playwright。
- 为以下链路建立最小测试：
  - 图片读取和文件类型校验。
  - 图片链接规则生成。
  - 单张和批量上传请求序列。
  - 压缩、水印、Base64。
  - 登录自动跳转。
  - `/toolbox` 三个入口。
- 建立无真实 Token 的 GitHub API mock。
- 记录 375、768、1024、1440px 的关键页面截图基线。

建议脚本：

```json
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "lint:style": "stylelint \"src/**/*.{vue,styl,css}\"",
    "format": "eslint . --fix",
    "format:check": "eslint .",
    "verify": "pnpm lint && pnpm lint:style && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

退出条件：

- 基线测试稳定。
- 所有失败均有存量清单。
- CI 可以复现本地结果。

### 阶段 1：统一 Node、pnpm 与 CI

目标：消除环境差异。

任务：

- 新增 `.nvmrc` 或 `.node-version`，固定 Node 24 LTS。
- `package.json` 增加：

```json
{
  "engines": {
    "node": ">=24 <25"
  },
  "packageManager": "pnpm@11.18.0"
}
```

- 使用 Corepack 管理 pnpm。
- GitHub Actions 更新到受支持的主版本。
- CI 从 `npm install --legacy-peer-deps` 改为：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify
```

- 对依赖脚本采用 pnpm 11 的显式允许策略，不默认执行未知依赖的安装脚本。
- 缓存 pnpm store，而不是提交或缓存项目 `node_modules`。

退出条件：

- 本地和 CI 都使用 Node 24／pnpm 11。
- `pnpm install --frozen-lockfile` 可重复。
- 部署产物与当前线上入口一致。

### 阶段 2：Vue 运行时小步升级

目标：先升级不涉及构建器替换的运行时依赖。

顺序：

1. Vue 与 `@vue/compiler-sfc` 升级到 3.5.40，并保持完全同版本。
2. Element Plus 升级到 2.14.3。
3. Axios 升级到 1.19.0。
4. Vue Router 升级到 5.2.0。
5. Vue I18n 按 9 → 10 → 11 的迁移文档逐步升级。

重点修改：

- Element Plus locale 改用当前公开导出路径，不再导入 `element-plus/lib/...`。
- 路由类型使用 `RouteRecordRaw` 的 type-only import。
- 将主要路由改为 lazy import，为插件加载做准备。
- 删除手写 `next()` 风格守卫，改为返回式守卫。
- 修复由 Element Plus Props、事件和 slot 类型收紧暴露的问题。
- i18n 切换 Composition API。

退出条件：

- 三种语言切换正常。
- 明暗主题和 Element Plus locale 正常。
- 登录、配置、上传、管理、设置和三个工具冒烟通过。
- 无新增控制台 warning。

### 阶段 3：TypeScript 4.9 → 5.9 → 6.0

目标：在 Vite 大升级前完成类型现代化。

任务：

- 先升到 TypeScript 5.9，修复存量类型问题。
- 再升到 TypeScript 6.0.x，处理所有弃用项。
- 引入分层配置：

```text
tsconfig.json
tsconfig.app.json
tsconfig.node.json
tsconfig.test.json
```

- 应用建议设置：

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedSideEffectImports": true,
    "verbatimModuleSyntax": true,
    "rootDir": "./src",
    "types": ["vite/client", "vite-plugin-pwa/client"],
  },
}
```

- 删除 `typeRoots: ["./node_modules/@types/"]`，避免覆盖默认解析规则。
- 把自动导入 d.ts 纳入明确 include。
- 修复 `require: true` 等 Props 拼写错误。
- 逐步消除 `any`、`@ts-ignore`、Props 直接变更和非类型导入。

退出条件：

- `pnpm typecheck` 无错误。
- Vue 模板表达式和自动导入都有类型。
- 没有依赖 `ignoreDeprecations` 才能通过。

### 阶段 4：ESLint 10、Antfu Stylistic、Stylelint 17

目标：现代化工程规范，并让规则服务于插件边界。

任务：

- 将 `.eslintrc.js` 迁移为 `eslint.config.ts` 或 `eslint.config.mjs`。
- 使用 `@antfu/eslint-config` 统一承载 TypeScript、Vue、Import 和 Stylistic 规则。
- 只保留 `eslint` 与 `@antfu/eslint-config` 两项直接 ESLint 依赖，内部插件由预设管理。
- 移除 Airbnb Base、eslint-plugin-prettier 和 Prettier，避免两套格式规则互相改写。
- 把自动导入 globals 通过 unplugin 生成的 ESLint 配置接入 Flat Config。
- 增加架构限制：
  - `utils` 禁止导入 `views`。
  - Shell 禁止导入插件内部模块。
  - 插件禁止导入 Shell Store、Router 和 Axios 单例。
- 由 `@antfu/eslint-config` 的 Stylistic 规则统一提供格式化能力。
- Stylelint 升级到 17.14.1，更新 Stylus 规则。
- 删除已无维护价值的 rational-order 配置，使用标准规则和明确的 order 插件。

退出条件：

- `pnpm lint`、`pnpm lint:style` 通过，`pnpm format:check` 复用 ESLint 门禁。
- lint 不修改文件，修复使用单独的 `lint:fix`。
- pre-commit 只检查暂存文件。

### 阶段 5：Vite 2 → Vite 8

目标：完成构建器升级并验证 Rolldown。

### 5.1 先规范 Vite 配置

- 使用 `defineConfig`。
- 使用 ESM 和 `node:path`／`node:url`。
- 别名改为文件 URL 解析，禁止 `replacement: '/src'`。
- 移除 `vue-i18n` 的 CJS 构建别名。
- 评估 Vite 8 的 `resolve.tsconfigPaths`。
- 把 `build.minify` 与 console 清理改成环境可控策略；生产错误日志不能被全部误删。
- 检查 Stylus `imports` 是否仍是公开配置，必要时统一到 `additionalData`。

### 5.2 按主版本验证

每一步只更新 Vite、plugin-vue 及直接 Vite 插件：

1. Vite 5 最新补丁。
2. Vite 7 最新补丁。
3. 在 Vite 7 用 `rolldown-vite` 替代进行兼容测试。
4. Vite 8.2.0。

Vite 插件兼容矩阵：

| 插件                | Dev  | Build | HMR    | PWA      | WASM   | 结论 |
| ------------------- | ---- | ----- | ------ | -------- | ------ | ---- |
| plugin-vue          | 必测 | 必测  | 必测   | 不适用   | 不适用 |      |
| auto-import         | 必测 | 必测  | 必测   | 不适用   | 不适用 |      |
| components          | 必测 | 必测  | 必测   | 不适用   | 不适用 |      |
| icons               | 必测 | 必测  | 必测   | 离线图标 | 不适用 |      |
| update-notification | 必测 | 必测  | 不适用 | 更新交互 | 不适用 |      |
| vite-plugin-pwa     | 必测 | 必测  | 不适用 | 必测     | 不适用 |      |
| 图片编解码器        | 必测 | 必测  | 不适用 | 离线处理 | 必测   |      |

退出条件：

- Vite 8 dev、build、preview 都通过。
- 无 Node CJS API deprecation。
- WASM 路径、Worker、PWA 和自动导入正常。
- 构建产物无意外重复 Vue、Element Plus 或编解码器。

### 阶段 6：Vuex → Pinia

目标：为动态插件 Store 和类型化组合建立基础。

策略：

- Vuex 和 Pinia 短期共存。
- 每迁移一个 Store，同步迁移其调用组件和测试。
- 新 Pinia Store 使用 Setup Store 或职责清晰的 Option Store。
- 持久化不依赖“把整个 Store JSON 化”，由独立 repository 负责 schema 迁移。
- 不把大图 Base64 写入持久化 Store。

建议目标 Store：

```text
stores/
├── auth.ts
├── user-preferences.ts
├── plugin-registry.ts
├── workspace.ts
├── jobs.ts
└── notifications.ts
```

GitHub 图床的仓库、目录、图库和部署状态最终迁入图床插件自己的 Store，不继续作为平台全局状态。

退出条件：

- Vuex 无调用后移除依赖。
- 登录退出能清理平台和插件状态。
- Store 可独立单测并支持 HMR。

### 阶段 7：替换图片压缩内核

当前 `@yireen/squoosh-browser`：

- 最新仍为 1.0.7。
- 最后更新时间为 2022-04-11。
- PicX 直接导入其 `dist/client/lazy-app/feature-meta` 私有路径。

这会阻碍 Vite 8、WASM、Worker 和长期维护。

建议方案：

- 使用维护中的 jSquash 编解码模块：
  - `@jsquash/avif` 2.1.1。
  - `@jsquash/jpeg` 1.6.0。
  - `@jsquash/webp` 1.5.0。
- 编解码运行在 Web Worker。
- 通过平台 `ImageCodec` 接口隔离具体库。
- WASM 资源通过 Vite 官方 URL／Worker 导入方式打包，不手写依赖内部路径。
- 为编码器建立黄金样本测试：
  - JPEG、有透明通道 PNG、WebP、AVIF。
  - EXIF 方向。
  - 超大图。
  - 编码失败和取消。
  - 输出 MIME、扩展名和文件名一致。

注意：jSquash 是建议候选，不应在没有质量、体积、许可证和浏览器兼容对比的情况下直接替换。

### 阶段 8：PWA、依赖安全与发布

任务：

- vite-plugin-pwa 升级到 1.3.0。
- 修正 512 图标的 manifest `sizes`。
- 给插件清单、Worker 和 WASM 资源设计缓存策略。
- 更新时不立即让运行中的图片任务失效；先提示保存或完成任务。
- 增加离线工具模式：本地压缩、Base64、水印可用，GitHub 图床显示离线状态。
- 引入依赖审计、许可证清单和 SBOM。
- pnpm 配置 `minimumReleaseAge`，降低刚发布恶意包进入供应链的概率。
- pnpm 启用 `trustPolicy: no-downgrade`。Workbox 7.4.1 固定引入的
  `@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1` 与 `semver@6.3.1`
  已确认只来自 `vite-plugin-pwa` 链路，并经用户明确授权设置精确版本例外。
- 发布前执行：

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
```

## 6. 建议的最终 package 结构

以下只表达分类，不是直接复制执行的完整 `package.json`：

```jsonc
{
  "dependencies": {
    "axios": "1.19.0",
    "element-plus": "2.14.3",
    "pinia": "4.0.2",
    "vue": "3.5.40",
    "vue-i18n": "11.4.8",
    "vue-router": "5.2.0",
  },
  "devDependencies": {
    "@antfu/eslint-config": "9.2.0",
    "@vitejs/plugin-vue": "6.0.8",
    "@vue/compiler-sfc": "3.5.40",
    "@vue/test-utils": "2.4.11",
    "eslint": "10.8.0",
    "playwright": "1.62.1",
    "stylelint": "17.14.1",
    "typescript": "6.0.x",
    "vite": "8.2.0",
    "vite-plugin-pwa": "1.3.0",
    "vitest": "4.1.10",
    "vue-tsc": "3.3.8",
  },
}
```

版本执行时仍需用 `pnpm view` 复核，因为本文版本快照会随时间过期。

## 7. 不建议同时进行的变更

以下组合会让问题无法归因：

- Vite 8 升级与图片压缩库替换。
- Vuex 到 Pinia与图床插件拆分。
- Element Plus 大版本升级与全站 UI 重做。
- Vue I18n Legacy 迁移与全部翻译 key 重命名。
- Stylus 退出与响应式布局重构。
- PWA 更新策略修改与远程插件缓存引入。

每一对至少拆成两个可独立通过验证的任务。

## 8. 验证矩阵

| 维度   | 验证项                                                 |
| ------ | ------------------------------------------------------ |
| 安装   | 干净 pnpm store、`--frozen-lockfile`、无 npm 锁文件    |
| 类型   | `.ts`、`.vue` 模板、自动导入、路由 meta、i18n key      |
| 构建   | dev、build、preview、source map、chunk、WASM、Worker   |
| 浏览器 | Chrome、Safari、Firefox 当前稳定版                     |
| 响应式 | 375、768、1024、1440px                                 |
| 主题   | 浅色、深色、跟随系统                                   |
| 语言   | 简中、繁中、英文                                       |
| GitHub | OAuth 替身、Token 登录、限流、401、403、404、422、超时 |
| 图片   | PNG、JPEG、GIF、WebP、AVIF、透明、EXIF、大图、批量     |
| PWA    | 安装、离线、旧缓存升级、更新提示                       |
| 安全   | Token 不入日志、无远程脚本漂移、CSP、依赖审计          |

## 9. 回滚策略

- 每个阶段一个独立分支和独立提交序列。
- 不在同一提交混合依赖升级、业务改造和格式化。
- 保留阶段开始前的 lockfile。
- Vite 每次主版本迁移都保留构建产物摘要和端到端截图。
- 新 Store 与旧 Store 并行期间使用明确的 feature flag，切换失败可回旧实现。
- PWA 发布必须保留上一版本的可重新部署产物，防止 Service Worker 更新故障。

## 10. 2026-07-31 实际执行记录

本轮已经完成：

| 阶段 | 执行结果 |
| ---- | -------- |
| 运行环境 | Node.js 固定为 24 LTS，pnpm 声明升级到 11.18.0，CI 改用 pnpm 冻结安装与统一验证脚本 |
| Vue 运行时 | Vue、Vue Router、Vue I18n、Element Plus 和 Axios 升级到目标版本，路由改为懒加载，i18n 改为 Composition 模式 |
| 状态管理 | 运行时迁移到 Pinia 4，并提供旧调用方式的兼容门面；Vuex 依赖已移除 |
| TypeScript | 升级到 6.0.x，拆分应用、Node、测试和 Worker 配置，正式增加 SFC 与 Worker 类型门禁 |
| 代码规范 | ESLint 10 改为 Flat Config，只直接使用 `eslint` 与 `@antfu/eslint-config`；格式化统一由 ESLint 负责 |
| 构建系统 | Vite 升级到 8.2.0，Vite 配置迁移到 ESM，生产构建与 PWA 生成通过 |
| 图片编解码 | 移除旧压缩库运行时依赖，使用 jSquash 的 JPEG、WebP、AVIF 公共包，并在 Web Worker 中执行编码 |
| PWA 与供应链 | vite-plugin-pwa 升级到 1.3.0；启用依赖信任策略，并只为两个已确认的 Workbox 传递依赖设置精确例外 |
| 测试门禁 | 新增 Vitest 与 Playwright；桌面 Chrome 和 375px 移动端 Chrome 共 4 条路由冒烟用例通过 |

本轮验证结果：

```text
pnpm peers check
pnpm verify
pnpm test:e2e
git diff --check
```

上述命令均已通过。`pnpm verify` 覆盖 ESLint、Stylelint、应用与 Worker
类型检查、Vitest 单元测试、Vite 生产构建和 PWA 生成。

仍需在发布前继续完成的专项验收：

- 使用真实 GitHub OAuth／Token 的仓库初始化、上传、管理和部署回归。
- Safari、Firefox 以及 768px、1024px、1440px 的完整响应式回归。
- JPEG、透明 PNG、WebP、AVIF、EXIF、超大图和取消任务的编解码黄金样本。
- PWA 安装、离线回退、旧 Service Worker 缓存升级和更新中任务保护。
- 旧 ESLint、Stylelint、Prettier 与 Vuex 迁移参考文件，在获得删除许可后清理。

## 11. 官方参考

- [Node.js 发布状态](https://nodejs.org/en/about/previous-releases)
- [pnpm 官方文档](https://pnpm.io/)
- [Vue 3.5 发布说明](https://blog.vuejs.org/posts/vue-3-5)
- [Vue Router 4 升级到 5](https://router.vuejs.org/guide/migration/v4-to-v5)
- [Pinia 从 Vuex ≤4 迁移](https://pinia.vuejs.org/cookbook/migration-vuex.html)
- [Vue I18n v11 破坏性变更](https://vue-i18n.intlify.dev/guide/migration/breaking11)
- [Vite 8 发布说明](https://vite.dev/blog/announcing-vite8)
- [Vite 8 迁移指南](https://vite.dev/guide/migration.html)
- [TypeScript 7.0 发布说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [ESLint Flat Config 迁移](https://eslint.org/docs/latest/use/configure/migration-guide)
- [ESLint 10 迁移](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [Element Plus 安装文档](https://element-plus.org/en-US/guide/installation.html)
- [Vite PWA 指南](https://vite-pwa-org.netlify.app/guide/)
- [jSquash 官方仓库](https://github.com/jamsinclair/jSquash)
