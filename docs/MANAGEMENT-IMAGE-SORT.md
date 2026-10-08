# 图床管理页排序功能设计

## 背景

图床管理页的列表顺序即 GitHub Contents API 的返回顺序（按文件名字节序）。新上传的图片根据文件名插入到列表中部或尾部，图片数量多时需要在长列表中翻找。

## 功能

工具栏新增排序下拉按钮，提供四种模式，选择结果持久化（跨会话记住偏好）：

| 模式 | 说明 |
| --- | --- |
| 默认排序 | GitHub API 返回顺序（现状） |
| 名称升序 | 按文件/目录名升序（数字感知比较） |
| 名称降序 | 按文件/目录名降序 |
| 最新上传优先 | 按上传时间降序，未知时间的文件排在已知时间文件之后 |

## 关键约束：GitHub Contents API 不返回文件时间戳

`GET /repos/{owner}/{repo}/contents/{path}` 返回的条目只有 `name`、`sha`、`size` 等，没有时间字段。因此“上传时间”采用两层来源：

1. **本机上传即记录**：PicX 上传成功后（`uploadedHandle`）在图片对象上写入 `uploadTime = Date.now()`，零额外请求，覆盖“刚上传完想找图”的主场景。
2. **后台按需回填**：开启“最新上传优先”后，对缺少 `uploadTime` 的文件调用 `GET /repos/{owner}/{repo}/commits?path={filePath}&per_page=1&ref={branch}` 取最近一次 commit 时间作为上传时间。结果写入图片对象并随目录树持久化，同一文件终身只请求一次（除非清空浏览器存储）。回填过程并发受限、可取消、失败静默（不打扰用户，下次进入页面重试）。

已知取舍：

- 回填是逐文件请求，图片很多的目录首次开启时间排序时会有一段后台请求期（期间列表实时重排）；有缓存后后续进入瞬时完成。
- 在其他设备或 GitHub 网页端上传的文件，需等当前设备首次时间排序时回填。
- 排序只作用于视图渲染（派生 computed），不修改 Store 中目录树的真实顺序（Store 顺序始终为 GitHub 返回顺序）。

## 数据结构变更

```ts
// UploadedImageModel 新增可选字段
uploadTime?: number // 上传时间（毫秒时间戳）；历史数据与本机未回填数据为 undefined

// UserSettingsModel 新增
management: {
  sort: ImageSortEnum
}

// 新增枚举
export enum ImageSortEnum {
  default = 'default'
  nameAsc = 'nameAsc'
  nameDesc = 'nameDesc'
  timeDesc = 'timeDesc' // 最新上传优先
}
```

- `UserSettingsModel` 的默认值在 `picx-store.ts` 的 `createDefaultUserSettings` 中补充，旧 LocalStorage 数据经 `deepAssignObject` 深合并自动补齐新字段。
- `uploadTime` 随 `dirObject`（LocalStorage `LS_MANAGEMENT`）持久化；目录树条目按 name 去重保留旧对象，已回填的时间在重新拉取列表后依然保留。

## 模块边界

```text
views/imgs-management/components/tools-bar   排序下拉 UI，读写 userSettings.management.sort
views/imgs-management/imgs-management.vue    sortMode computed → sortedDirList / sortedImageList（仅渲染顺序）
views/imgs-management/imgs-management.util   sortDirList / sortImageList 纯函数（不改入参）
composables/use-image-upload-time            回填编排：并发限制、去重、取消、防抖持久化
common/api/dir.ts                            getLatestCommitTime（commits API）
utils/upload-utils.ts                        上传成功写入 uploadTime
```

- Store 的 `DIR_IMAGE_LIST_*` 现有 action 不变更；回填结果直接写入响应式图片对象，防抖调用既有 `DIR_IMAGE_LIST_PERSIST`。
- 回填属于页面级副作用，放在 composable 中，不进入 Store action。

## 请求与限流评估

- 回填仅由用户主动选择“最新上传优先”触发，且每个文件只请求一次；认证后限额 5000 次/小时，典型目录（几百张图）一次性成本可接受。
- 请求使用 `noShowErrMsg: true` 静默失败，不弹全局错误提示；`per_page: 1` 最小化响应体积。

## 国际化

新增 `management_page.sort*` 系列 key，同步维护 zh-CN / zh-TW / en 三个语言文件。
