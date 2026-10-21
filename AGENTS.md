# 项目规则

## 项目概述

PicX · GitHub 图床一款基于 GitHub API 开发的图床工具，将图片上传托管到 GitHub 仓库，支持目录管理、批量操作，以及一键复制 Markdown / HTML / BBCode 等格式的图片链接。

## 技术约束

- 使用 Vue 3 Composition API 和 `<script setup lang="ts">`；
- TypeScript 保持严格模式，禁止滥用 `any` 或绕过类型检查。
- 页面通过路由动态 `import()` 懒加载。
- 优先使用 Element Plus 组件库，禁止无意义封装 `ElButton`、`ElInput`、`ElSelect` 等基础组件。
- 组件封装遵循 [.agents/rules/component-structure.md](.agents/rules/component-structure.md)。
- 禁止在源码模板中添加任何 `aria-*` 属性；修改既有模板时移除其中的 `aria-*` 属性。


## 国际化规则

- 面向用户的新文本必须进入 `src/locales/zh-CN.json`、`src/locales/zh-TW.json`、`src/locales/en.json`。
- 禁止在模板或业务逻辑中硬编码面向用户的中文或英文。
- 同一概念的 key 应保持命名一致，插件翻译建议使用 `plugins.<pluginId>.*` 命名空间。
- 修改语言切换逻辑时，必须同时验证 Element Plus locale、页面标题和更新通知 locale。
