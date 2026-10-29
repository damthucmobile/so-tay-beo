import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "Sổ Tay Béo - Quản Lý Lớp Học & Thù Lao",
  description: "Ứng dụng Sổ Tay Béo quản lý lớp học, lịch tự do và đối soát thù lao giảng dạy",
  verification: {
    other: {
      "zalo-platform-site-verification": "UkIbBghECXSXiASKyQDrJ2ELs6ZFumCoE3Gm",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sổ Tay Béo",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="zalo-platform-site-verification" content="UkIbBghECXSXiASKyQDrJ2ELs6ZFumCoE3Gm" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('workscheduler_theme_store');
                if (stored) {
                  const parsed = JSON.parse(stored);
                  if (parsed.state && parsed.state.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  }
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
