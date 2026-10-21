// 界面断言固定使用简体中文；语言识别测试按场景覆盖浏览器首选语言。
Object.defineProperties(navigator, {
  language: { configurable: true, get: () => 'zh-CN' },
  languages: { configurable: true, get: () => ['zh-CN'] },
})
