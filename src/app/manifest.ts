import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HaoXue - 好学',
    short_name: 'HaoXue',
    description: 'Ứng dụng học tiếng Trung giao tiếp HaoXue',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007AFF',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
