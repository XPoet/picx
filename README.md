<a href="https://picx.xpoet.cn" >
<img width="100" align="right" alt="PicX" src="https://picx-docs.xpoet.cn/images/logo.png">
</a>

# PicX

[![Release](https://img.shields.io/github/release/XPoet/picx?style=flat&logo=github)](https://github.com/XPoet/picx/releases)
[![License](https://img.shields.io/github/license/XPoet/picx?style=flat&logo=github)](https://github.com/XPoet/picx/blob/master/LICENSE)
[![Stars](https://img.shields.io/github/stars/XPoet/picx?style=flat&logo=github&color=3366cc)](https://github.com/XPoet/picx)
[![Issues](https://img.shields.io/github/issues/XPoet/picx?style=flat&logo=github)](https://github.com/XPoet/picx/issues)
[![Deploy](https://github.com/XPoet/picx/workflows/deploy/badge.svg)](https://github.com/XPoet/picx/actions/workflows/deploy.yml)

**[PicX](https://picx.xpoet.cn)** 是一款基于 GitHub API 开发的图床工具，提供图片上传托管、生成图片链接和常用图片工具箱服务。

---

## 亮点 | Highlights

- 在线使用、无需下载、无需安装。
- 操作简单、文档完善、持续维护。
- 代码开源、数据安全、完全免费。

## 如何使用 | How to use

通过 [GitHub OAuth 授权](https://picx-docs.xpoet.cn/usage-guide/config.html#github-oauth-%E6%8E%88%E6%9D%83%E7%99%BB%E5%BD%95) 或 [填写 GitHub Token](https://picx-docs.xpoet.cn/usage-guide/config.html#%E5%A1%AB%E5%86%99-github-token-%E7%99%BB%E5%BD%95) 登录到 [PicX](https://picx.xpoet.cn)，完成 [图床配置](https://picx-docs.xpoet.cn/usage-guide/config.html#%E5%9B%BE%E5%BA%8A%E9%85%8D%E7%BD%AE) 后即可使用。

**在线使用入口 https://picx.xpoet.cn**

> **重要提示：**  
> - 为进一步简化用户操作，PicX 自 `v3.0` 起，不再支持自由选择仓库和分支，统一使用内置的仓库和分支。  
> - 如需继续使用自定义的仓库和分支，请使用 [PicX v2.0](https://v2.picx.xpoet.cn)。

## 文档 | Documents

**官方文档 https://picx-docs.xpoet.cn**

通过阅读 **[快速开始](https://picx-docs.xpoet.cn/usage-guide/get-start.html)** 教程，可帮助你迅速上手 PicX。 

## 功能 | Features

- [x] 支持 **[拖拽](https://picx-docs.xpoet.cn/usage-guide/upload.html#%E6%8B%96%E6%8B%BD%E5%9B%BE%E7%89%87)**、**[复制粘贴](https://picx-docs.xpoet.cn/usage-guide/upload.html#%E5%A4%8D%E5%88%B6%E7%B2%98%E8%B4%B4)**、**[选择文件](https://picx-docs.xpoet.cn/usage-guide/upload.html#%E9%80%89%E6%8B%A9%E6%96%87%E4%BB%B6)** 等方式进行选择图片
- [x] 支持上传时对图片名称进行 **[重命名](https://picx-docs.xpoet.cn/usage-guide/upload.html#%E9%87%8D%E5%91%BD%E5%90%8D)**、**[哈希化](https://picx-docs.xpoet.cn/usage-guide/upload.html#%E5%93%88%E5%B8%8C%E5%8C%96)**（确保图片名唯一）和 **[添加前缀](https://picx-docs.xpoet.cn/usage-guide/upload.html#%E6%B7%BB%E5%8A%A0%E5%89%8D%E7%BC%80)**
- [x] 支持 **[批量上传图片](https://picx-docs.xpoet.cn/usage-guide/upload.html)**、**[批量删除图片](https://picx-docs.xpoet.cn/usage-guide/management.html#%E6%89%B9%E9%87%8F%E5%88%A0%E9%99%A4%E5%A4%9A%E5%BC%A0%E5%9B%BE%E5%BA%8A)** 和 **[批量复制图片链接](https://picx-docs.xpoet.cn/usage-guide/management.html#%E6%89%B9%E9%87%8F%E5%A4%8D%E5%88%B6%E5%A4%9A%E5%BC%A0%E5%9B%BE%E7%89%87%E9%93%BE%E6%8E%A5)**
- [x] 支持图床 **多级目录** 管理 （[创建多级目录](https://picx-docs.xpoet.cn/usage-guide/config.html#%E6%96%B0%E5%BB%BA%E5%A4%9A%E7%BA%A7%E7%9B%AE%E5%BD%95) / 查看多级目录下图片）
- [x] 支持 **[一键复制](https://picx-docs.xpoet.cn/usage-guide/upload.html#%E5%A4%8D%E5%88%B6%E5%9B%BE%E7%89%87%E9%93%BE%E6%8E%A5)** 图片链接和 **[自由转换 Markdown / HTML / BBCode 格式](https://picx-docs.xpoet.cn/usage-guide/settings.html#%E5%9B%BE%E7%89%87%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AE%BE%E7%BD%AE)**
- [x] 内置 **[多种图片链接规则](https://picx-docs.xpoet.cn/usage-guide/settings.html#%E5%9B%BE%E7%89%87%E9%93%BE%E6%8E%A5%E8%A7%84%E5%88%99%E9%85%8D%E7%BD%AE)**（GitHub、GitHub Pages、jsDelivr、Statically 等）
- [x] 支持 **[自定义配置图片链接规则](https://picx-docs.xpoet.cn/usage-guide/settings.html#%E9%85%8D%E7%BD%AE%E8%87%AA%E5%AE%9A%E4%B9%89%E5%9B%BE%E7%89%87%E9%93%BE%E6%8E%A5%E8%A7%84%E5%88%99)**
- [x] 支持 **[图片压缩](https://picx-docs.xpoet.cn/usage-guide/settings.html#%E5%9B%BE%E7%89%87%E5%8E%8B%E7%BC%A9%E8%AE%BE%E7%BD%AE)** (内置高效压缩算法，可配置在上传前自动压缩)
- [x] 支持配置 **[图片水印](https://picx-docs.xpoet.cn/usage-guide/settings.html#%E5%9B%BE%E7%89%87%E6%B0%B4%E5%8D%B0%E8%AE%BE%E7%BD%AE)**
- [x] 支持 **PWA**
- [x] 支持 **[暗夜模式](https://picx-docs.xpoet.cn/usage-guide/settings.html#%E4%B8%BB%E9%A2%98%E8%AE%BE%E7%BD%AE)** (自动切换 / 自由切换)
- [x] i18n（中文简体、中文繁体、英文）
- [x] 工具箱（[图片压缩](https://picx-docs.xpoet.cn/usage-guide/toolbox.html#%E5%9B%BE%E7%89%87%E5%8E%8B%E7%BC%A9)、[图片转 Base64](https://picx-docs.xpoet.cn/usage-guide/toolbox.html#%E5%9B%BE%E7%89%87%E8%BD%AC-base64)、[图片水印](https://picx-docs.xpoet.cn/usage-guide/toolbox.html#%E5%9B%BE%E7%89%87%E6%B0%B4%E5%8D%B0)）

## 贡献 | Contribution

欢迎各种形式的贡献，包括但不限于：美化界面、增加功能、性能优化、修复 Bug、完善文档等。

参与贡献必读：[PicX 贡献指南](https://picx-docs.xpoet.cn/contribution-guide/contribution-guide.html)

### 致谢

这个项目的存在多亏了所有的贡献者，在此表示感谢。

<a href="https://github.com/XPoet/picx/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=XPoet/picx" />
</a>

##  反馈 | Feedback

在使用过程中，如遇问题，请仔细阅读 **[官方文档](https://picx-docs.xpoet.cn)**，或在 GitHub 发起 **[Issue](https://github.com/XPoet/picx/issues)**。

## 赞赏 | Appreciation

PicX 的更新迭代依靠作者工作之外的时间，维护不易，如果对你有帮助，可以赞赏作者，支持开源。

<img width="320" src="https://xpoet.cn/images/admire-code-wechat.webp" />

## 许可 | License

**[AGPL-3.0](https://github.com/XPoet/picx/blob/master/LICENSE)** 

Copyright © 2020-Present XPoet
