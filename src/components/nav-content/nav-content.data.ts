export const navInfoList = [
  { name: 'nav.home', path: '/', to: { path: '/', query: { jump: '0' } } },
  { name: 'nav.upload', path: '/upload', to: '/upload' },
  { name: 'nav.management', path: '/management', to: '/management', requiresLogin: true },
  { name: 'nav.settings', path: '/settings', to: '/settings', requiresLogin: true },
  // P2 T015 在目录配置迁移完毕后收口此入口。
  { name: 'nav.config', path: '/config', to: '/config' },
] as const
