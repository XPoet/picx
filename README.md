# PicX

[![Github Author](https://img.shields.io/badge/author-XPoet-orange.svg)](https://github.com/XPoet)
[![Github Release](https://img.shields.io/github/release/XPoet/picx.svg)](https://github.com/XPoet/picx/releases)
[![Github License](https://img.shields.io/github/license/XPoet/picx.svg)](https://github.com/XPoet/picx/blob/master/LICENSE)

**一款你想要的图床管理神器，轻松解决所有图床难题！**  

---

**你曾经为图床问题烦恼过吗？** 

> 在网上复制了一个心仪的图片链接，用着用着某一天就失效了，烦~

> 特意租个云服务器托管图片好奢侈，而且上传操作好繁琐，烦~

> 有使用过某公司的免费图床，但都有期限，速度又慢，存储空间小，还限流量，烦~

> 想白嫖免费好用的图床，找了N久找不到，烦~

**难道就没有一款免费的，稳定的，访问快的，还不限量的的图床管理工具吗？┭┮﹏┭┮**

<h1>有！</h1>
<h2>有！！</h2>
<h3>有！！！</h3>

**PicX，基于 GitHub API + jsDelivr 搭建的图床神器，免费、稳定、极速、高效，免下载，免安装，打开[网站](https://picx.xpoet.cn/)即可使用。。**

PicX

**有！不仅免费、稳定、速度快（全球 CDN 加速）、还不限容量和流量，而且操作简单，免下载，免安装，打开[网站](https://picx.xpoet.cn/)即可使用。**

你只需注册一个 GitHub 账号，当然，我相信你早就有 GitHub 账号了。



## Features 功能特性

- [x] **拖拽图片**进行上传。

- [x] **复制粘贴图片**进行上传。

- [x] **选择文件夹图片**进行上传。

- [x] 图片重命名。

- [x] 图片哈希命名（保证图片命名不重复）。

- [x] 一键复制 GitHub 和 CDN 图片外链

- [x] 自动目录（可自动生成存储图片的目录）

- [x] 图床管理（仓库图片的增删改查）

- [ ] 图片压缩

- [ ] 批量上传

## How to use 如何使用

1. 创建一个用来存储图片的 GitHub 仓库 
   https://github.com/new  
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.j1486dtk68n.png)

2. 创建一个有 repo 权限的 GitHub Token
   https://github.com/settings/tokens/new
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.lpt1xl9fu.png)
   
   新生成的 Token 只能显示一次，如有遗失，重新生成即可。
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.krns6rvn9l.png)

3. 进入 [PicX 官网](https://picx.xpoet.cn/) ，进行图床配置（绑定GitHub Token、存储图片的仓库和目录）

   1. 填写 Token，自动获取该用户仓库信息
      ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.g6952hwzk0b.png)
      
   2. 在已有仓库的下拉列表中，选择一个作为图床的仓库
      ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.6gt8pv21ig9.png)
      
   3. 选择一种目录方式（目录即是在仓库中存放图片的文件夹）  
      自动目录：自动生成日期格式 `YYYYMMDD` 的目录。例如：`20200909`。  
      新建目录：需手动输入一个新目录。  
      选择仓库目录：自动获取仓库下所有目录，选择一个即可。
      ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.xbquoyed5vi.png)
      
   4. 完成了图床配置，现在就可以开始上传图片了，来试试吧~   
             
4. 上传图片，可通过拖拽图片、复制粘贴，点击上传区域选择图片来进行上传。
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.jxsg2o9ie4b.png)
   
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.z4ry2u7ae1.png)

5. 复制图片外链
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.h6b57mhgtbr.png)

## Contribution 贡献

欢迎各种形式的贡献，包括但不限于：美化界面、增加功能、改进代码、 修复 Bug 等。

## Feedback 反馈

使用过程中，如果遇到问题，请仔细阅读使用文档，或者给作者提 `Issue`。

## Licence 许可

[MIT](https://github.com/XPoet/picx/blob/master/LICENSE) Copyright (c) 2020 XPoet
