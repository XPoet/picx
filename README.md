# PicX

[![Author](https://img.shields.io/badge/author-XPoet-orange.svg)](https://github.com/XPoet)
[![Release](https://img.shields.io/github/release/XPoet/picx.svg)](https://github.com/XPoet/picx/releases)
[![License](https://img.shields.io/github/license/XPoet/picx.svg)](https://github.com/XPoet/picx/blob/master/LICENSE)
[![Stars](https://img.shields.io/github/stars/XPoet/picx)](https://github.com/XPoet/picx)
[![Issues](https://img.shields.io/github/issues/xpoet/picx)](https://github.com/XPoet/picx/issues)
[![Deploy](https://github.com/XPoet/picx/workflows/deploy/badge.svg)](https://github.com/XPoet/picx/actions/workflows/deploy.yml)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-Airbnb-hotpink.svg)](https://github.com/lin-123/javascript)


> 官方网站 https://picx.xpoet.cn/

**基于 GitHub API 开发的图床神器。** 图片外链使用 jsDelivr 自动进行 CDN 加速。不用下载、不用安装，打开 **[PicX 官网](https://picx.xpoet.cn/)** 即可使用。

您只需 **选择** 或 **[创建](https://github.com/new)** 一个 GitHub 仓库作为图床，然后在 **[PicX](https://picx.xpoet.cn/)** 进行 [配置](https://picx.xpoet.cn/#/config) 就可以使用了，如此简单。

亮点：:free: 完全免费、:trophy: 无比稳定、:rocket: 极速高效、:lock: 十分安全。

---

**灵魂拷问，你在为图床问题烦恼吗?**

- 用 Hexo 等静态博客写文章，正愁图片保存在哪里...
- 网上复制的心仪图片链接，用着用着某一天就失效了...
- 花钱租服务器托管图片，划不来，而且上传配置好繁琐...
- 其他公司的图床，都有时间期限，速度慢，存储空间小，还限流量...
- 想找一款真正免费、稳定、不限容量、访问速度还很快的图床...


## 功能特性 | Features 

- [x] 支持 **拖拽**、**复制粘贴**、**选择文件** 等方式进行上传图片
- [x] 支持图片 **重命名** 和 **哈希化**（保证图片名永不重复）
- [x] **一键复制** 图片外链（GitHub 和 CDN）
- [x] **图床管理**（仓库图片的**增删查**）
- [x] 支持图片 **批量上传** （批量选择/批量拖拽）
- [x] 支持 **PWA**
- [ ] i18n
- [ ] 自由切换 Git 厂商 （例如：Gitee / Coding）
- [ ] ~~图片压缩~~（前端使用 Canvas 实现的图片压缩效果极差，作者已放弃；如有需要，建议使用 [TinyPNG](https://tinypng.com/) ）


## 如何使用 | How to use 

1. 创建一个用来存储图片的 [GitHub 仓库](https://github.com/new) 。

   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.j1486dtk68n.png)

  <br>

2. 创建一个有 repo 权限的 [GitHub Token](https://github.com/settings/tokens/new) 。

   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.lpt1xl9fu.png)

   新生成的 Token 只会显示一次，请妥善保存，如有遗失，重新生成即可。

   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.pzmcp6b80fk.png)

  <br>

3. 进入 [PicX 官网](https://picx.xpoet.cn/) ，进行图床配置（绑定 GitHub Token、存储图片的仓库和目录）。

   1. 填写 Token，自动获取该用户下的仓库。

      ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/17961602582378_.pic.7955twzzcmc0.jpg)

   2. 在仓库的下拉列表中，选择一个作为图床的仓库。

      ![image](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.a24pdwe6b5.png)

   3. 选择一种目录方式（目录即仓库里存放图片的文件夹）。

      ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/dirModel.2mnglli43fk0.jpg)

      - 新建目录：需手动输入一个新目录。

      - 根目录：图片将直接存储在仓库根目录下。

      - 自动目录：自动生成日期格式 `YYYYMMDD` 的目录。例如：`20200909`。

      - 选择仓库目录：自动获取仓库下所有目录，选择一个即可。

     至此完成图床配置，现在就可以开始上传图片了，快去试试吧~

  <br>

4. 上传图片。

   - 可通过 **拖拽图片** 到上传区域进行上传。

   - 可通过 **复制粘贴图片** 到上传区域进行上传。粘贴图片时，需先点击一下**激活**上传区域，如下图，**上传区域的虚线边框变成墨蓝色，表示已激活，此时粘贴图片才生效**。支持通过键盘快捷键粘贴（`ctrl + v` / `command + v`）。

     ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.6wfw84e4xlw0.png)

   - 可通过 **选择文件夹图片** 到上传区域进行上传。

    选择图片完成后，会显示出图片详细信息，你可以 **自定义修改图片名称** 和 **给图片加上哈希码**（确保图片名不会重复）。

    ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.3ibdn25rjfe0.png)

  <br>

5. 图片上传成功后，即可复制图片外链。
   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/18031602583963_.pic_hd.70kvd1kgb880.jpg)

<br>

6. 图床管理，对仓库里保存的图片进行管理。
   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/ihm.3nr0yt9vrtk0.png)

## 贡献 | Contribution

欢迎各种形式的贡献，包括但不限于：美化界面、增加功能、改进代码、 修复 Bug 等。

##  反馈 | Feedback

使用过程中，如果遇到问题，请给作者提 [Issue](https://github.com/XPoet/picx/issues) 。

## 许可 | License

[MIT](https://github.com/XPoet/picx/blob/master/LICENSE) Copyright (c) 2020 XPoet
