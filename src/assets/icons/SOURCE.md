# 本地图标来源

Lucide 官方仓库 main，提取日期 2026-10-16。

- 来源：https://github.com/lucide-icons/lucide/tree/main/icons
- 本地 sprite SHA-256：`361103025f3d69e1a82f6717908de7b1ea5b7dcb062800d696aefa2847c1f9ab`。
- 原始路径与几何保持原样，转换为 SVG symbol；统一由 PicxIcon 管理尺寸、2px 描边、currentColor 和无障碍语义。
- 许可：同目录 LICENSE-lucide.txt，包含 ISC 及适用图标的 Feather MIT 声明。
- 应用只请求本地 sprite，无运行时图标包或远程字体请求。

P2 T014 补充 github、key-round、shield-check、eye、eye-off，取自官方 0.468.0 标签（https://github.com/lucide-icons/lucide/tree/0.468.0/icons），保持原始几何与既有许可证。

P2 T016 按同一官方 0.468.0 标签补充 git-branch、folder-open、circle-check。

P2 T019 按同一官方 0.468.0 标签补充 folder-root、calendar-days、folder-tree、folder-plus，对应目录弹窗四模式。

P3 T020 于 2026-10-17 通过 Pencil 只读核对 O9DRIk、OL0pP、dFSNj：上传画板使用 Lucide 的 image-up、upload、copy、clock-3、arrow-right、folder-git-2、folder、folder-cog、rotate-ccw、circle-dashed、rocket、plus、arrow-up-right 等。缺少资源从官方 0.468.0 标签逐个下载原始 SVG，保留几何，补充为 symbol；所有工作区图标通过 typed PicxIcon 使用。额外异常、详情与移除操作同样使用官方 Lucide，不引入其他图标体系。

本次补齐后的 sprite SHA-256：`0648a23e529002396907d4c63e36054fc24e676aea07c76867ea791bc84e3df1`。运行时仅访问本站本地资源，许可继续使用 LICENSE-lucide.txt。

P3 T028 将部署状态与操作中的 circle-dashed、circle-check、triangle-alert、rocket 同样接入 PicxIcon；所有 49 个 typed 图标名称均与本地 symbol 对应，sprite SHA-256 重新核对不变。

P4 T029 于 2026-10-17 通过 Pencil 只读核对 YxFJA、EAM8q、UUeb5；按设计稿从官方 0.468.0 标签下载 arrow-left、chevron-right、search、images、layout-grid、link、check、square-minus，附加管理操作继续使用同体系 play、video、pencil、folder-input。原始 SVG 下载后仅转为 symbol，几何不变，无新增依赖或运行时外域请求。不实现设计稿中尚无功能的列表切换。sprite SHA-256：`8131c0acbf2c38c644164d1ff45805a764ef9760b556445621d80cd66b22cb4d`。

P5 T034 于 2026-10-18 只读核对 M0qx2A，重新从官方 0.468.0 标签下载 check、minus、plus、chevron-down、rocket、download；既有 symbol 复用，补充缺少的 minus，原始几何不变。后续设置操作统一使用 PicxIcon，无新增依赖。sprite SHA-256：`04b88b19f2a900dc587904e9292ccecf496a06b97a664a130cbc0ae23fd6d114`。
