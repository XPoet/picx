# PicX

[![Github Author](https://img.shields.io/badge/author-XPoet-orange.svg)](https://github.com/XPoet)
[![Github Release](https://img.shields.io/github/release/XPoet/picx.svg)](https://github.com/XPoet/picx/releases)
[![Github License](https://img.shields.io/github/license/XPoet/picx.svg)](https://github.com/XPoet/picx/blob/master/LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E=12-green.svg?logo=Node.js&longCache=true)](https://nodejs.org/)

你曾经为图床问题烦恼过吗？~~（如果你还不清楚什么是图床，当我没问过这个问题）~~ 

作者采访了几位经常写博客的小姐姐

> A：在某网复制了一个好看的图片链接，用着用着有一天就失效了，烦~

> B：租个云服务器托管图片好奢侈，而且上传好繁琐，烦~

> C：有用过免费的图床，但都有期限，速度又慢，还限量，烦~

> D：想白嫖免费好用的图床，找了N久找不到，烦~

> E：巴拉巴拉巴拉，烦~

**难道就没有一款真正免费的，稳定的，不限量的的图床吗？┭┮﹏┭┮**

今天我郑重告诉你：**有！**

**不仅免费、稳定、速度快（CDN 加速）、还不限容量和流量，而且操作简单，免下载，免安装，打开网站即可使用。**

PicX，基于 GitHub 的图床神器，使用 jsDelivr 进行 CDN 加速，免费、稳定、高效。

你只需注册一个 GitHub 账号即可，当然，我相信你早就有 GitHub 账号了。

## Features 功能特性

- [x] 自动生成存储目录

- [x] 自动哈希命名

- [x] 可调图片压缩大小

- [x] 一键复制CDN外链

- [x] 拖拽、粘贴或选择文件上传

- [ ] 图床管理（图片的增删改查）


## How to use 如何使用

1. 创建一个用来存储图片的 GitHub 仓库 
   https://github.com/new  
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.j1486dtk68n.png)

2. 创建一个有 repo 权限的 GitHub Token
   https://github.com/settings/tokens/new
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.lpt1xl9fu.png)
   
   新生成的 Token 只能显示一次，如有遗失，重新生成即可。
   ![](https://cdn.jsdelivr.net/gh/XPoet/xpoet-image-hosting/PicX/image.krns6rvn9l.png)

3. 进入 [PicX 官网](https://xpoet.cn/picx) ，进行图床配置（绑定GitHub Token 和 仓库）

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


## Feedback 反馈

使用过程中，如果遇到问题，请仔细阅读使用文档，或者给作者提 `Issue`。

## Licence 许可

[MIT](https://github.com/XPoet/picx/blob/master/LICENSE) Copyright (c) 2020 XPoet
