# PicX

[![Author](https://img.shields.io/badge/author-XPoet-orange.svg)](https://github.com/XPoet)
[![Release](https://img.shields.io/github/release/XPoet/picx.svg)](https://github.com/XPoet/picx/releases)
[![License](https://img.shields.io/github/license/XPoet/picx.svg)](https://github.com/XPoet/picx/blob/master/LICENSE)

**一款基于 GitHub API 的免费、稳定且高效的图床管理神器。**

---

**灵魂拷问，你曾经为图床问题烦恼过吗 ❓**

> 在用静态博客网站写文章，正愁图片不知怎么保存，烦~

> 网上复制的心仪图片链接，用着用着某一天就失效了，烦~

> 特意花钱租个云服务器托管图片，划不来，而且上传操作好繁琐，烦~

> 曾经用过某某公司的免费图床，但都有时间期限，速度又慢，存储空间小，还限流量，烦~

**难道就没有一款真正免费的，稳定的，不限量的，访问速度还很快的图床管理工具吗？┭┮﹏┭┮**

<h2>有！</h2>

**PicX，基于 GitHub API 搭建的图床管理神器，免费、稳定、极速、高效，免下载，免安装，打开 [PicX 网站](https://picx.xpoet.cn/) 即可使用。**

你只需注册 GitHub 账号，创建一个仓库来作为你的图床，当然，我相信你早就有 GitHub 账号了。

## Features 功能特性

- [x] **拖拽图片**进行上传。

- [x] **复制粘贴图片**进行上传。

- [x] **选择文件夹图片**进行上传。

- [x] 图片**重命名**。

- [x] 图片名**哈希化**（保证图片名永不重复）。

- [x] 一键复制 GitHub 和 CDN 图片外链。

- [x] 自动目录（可自动生成存储图片的目录）。

- [x] 图床管理（仓库图片的增删改查）。

- [ ] 图片压缩。

- [ ] 批量上传。

- [ ] 接入 Gitee & coding 仓库。

- [ ] 语言国际化。

## How to use 如何使用

1. 创建一个用来存储图片的 [GitHub 仓库](https://github.com/new) 。

   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.j1486dtk68n.png)

 <br>

2. 创建一个有 repo 权限的 [GitHub Token](https://github.com/settings/tokens/new) 。

   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.lpt1xl9fu.png)

   新生成的 Token 只会显示一次，如有遗失，重新生成即可。

   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.krns6rvn9l.png)

<br>

3. 进入 [PicX 官网](https://picx.xpoet.cn/) ，进行图床配置（绑定 GitHub Token、存储图片的仓库和目录）。

   1. 填写 Token，自动获取该用户下的仓库。

      ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/17961602582378_.pic.7955twzzcmc0.jpg)

   2. 在仓库的下拉列表中，选择一个作为图床的仓库。

      ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/17971602582459_.pic.236arf47qso0.jpg)

   3. 选择一种目录方式（目录即仓库里存放图片的文件夹）。

      ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/dirModel.2mnglli43fk0.jpg)

      - 新建目录：需手动输入一个新目录。

      - 根目录：图片将直接存储在仓库根目录下。

      - 自动目录：自动生成日期格式 `YYYYMMDD` 的目录。例如：`20200909`。

      - 选择仓库目录：自动获取仓库下所有目录，选择一个即可。

      完成图床配置，现在就可以开始上传图片了，快去试试吧~

<br>

4. 上传图片。

   - 可通过**拖拽图片**到上传区域进行上传。

   - 可通过**复制粘贴图片**到上传区域进行上传。粘贴图片时，需先点击激活上传区域，如下图，**上传区域的虚线边框变成墨蓝色，表示已激活**。支持通过键盘快捷键粘贴（`ctrl + v` / `command + v`）。

     ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.6wfw84e4xlw0.png)

   - 可通过**选择图片**到上传区域进行上传。

    选择图片完成后，会显示出图片详细信息，你可以**自定义修改图片名称**和**给图片加上哈希吗（确保图片名不重复）。**

    ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/image.3ibdn25rjfe0.png)

<br>

5. 图片上传成功后，即可复制图片外链。
   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/18031602583963_.pic_hd.70kvd1kgb880.jpg)

<br>

6. 图床管理，对仓库里保存的图片进行管理。
   ![](https://cdn.jsdelivr.net/gh/XPoet/image-hosting@master/PicX/ihm.3nr0yt9vrtk0.png)

## Contribution 贡献

欢迎各种形式的贡献，包括但不限于：美化界面、增加功能、改进代码、 修复 Bug 等。

## Feedback 反馈

使用过程中，如果遇到问题，请给作者提 `Issue`。

## License 许可

[MIT](https://github.com/XPoet/picx/blob/master/LICENSE) Copyright (c) 2020 XPoet
