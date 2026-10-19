# 组件封装规范（强制执行）

## 一、目录结构规范（必须严格遵守）

所有组件必须按照以下标准目录结构创建，不得随意调整文件命名或结构：

```
component-name/             # 组件目录（与组件名保持一致，kebab-case）
  component-name.vue        # 组件主文件（必须使用 <script setup>）
  component-name.scss       # 组件样式文件
  component-name.util.ts    # 组件内部工具函数
  component-name.data.ts    # 组件内部静态数据
  component-name.model.ts   # 组件类型定义（interface / type）
  ...
```

### 具体要求

- 目录名必须使用 `kebab-case`
- 所有文件名必须与组件名完全一致
- 组件块顺序：template → script → style
- 类型定义必须放在 `component-name.model.ts`
- 工具函数必须放在 `component-name.util.ts`
- 静态数据必须放在 `component-name.data.ts`
- 样式必须单独抽离到 `component-name.scss`
- 组件内的 CSS 类命名必须遵循 BEM 规范
- 禁止将 util、type、data 混写进 `.vue` 文件（除非极简单场景）
- 组件内的代码行数应控制在 500 行以内，过长组件要考虑拆分

## 二、基础组件复用原则（优先级最高）

对于绝大多数常见基础组件：

- table
- button
- tag
- card
- tabs
- select
- progress
- dialog
- form
- input
- pagination
- dropdown
- tooltip
- badge
- 等

### 必须优先使用 Element Plus 组件库

- 能用 Element Plus 解决的，绝不自研
- 即使样式存在轻微差异，也优先通过样式覆盖解决
- 优先通过 props 封装
- 优先通过 slot 扩展
- 仅在业务强依赖时才允许自定义实现

## 三、组件设计原则

- 保持组件职责单一
- 保持 API 简洁
- 优先组合，不做重型封装
- 类型定义必须完整
- 所有 props 必须声明类型
- emit 必须声明类型
