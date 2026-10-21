import { IMAGE_PROCESSING_PLATFORM_URL } from '@/common/constant/settings'

export const navInfoList = [
  { name: 'nav.home', path: '/', to: { path: '/', query: { jump: '0' } } },
  { name: 'nav.upload', path: '/upload', to: '/upload' },
  { name: 'nav.management', path: '/management', to: '/management', requiresLogin: true },
  { name: 'nav.settings', path: '/settings', to: '/settings', requiresLogin: true },
  { name: 'nav.image_processing_platform', href: IMAGE_PROCESSING_PLATFORM_URL },
] as const
