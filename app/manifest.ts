// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sổ Tay Béo - Quản Lý Lịch Dạy & Thù Lao',
    short_name: 'Sổ Tay Béo',
    description: 'Ứng dụng Sổ Tay Béo quản lý thời khóa biểu, lịch dạy học và đối soát thù lao thông minh',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
