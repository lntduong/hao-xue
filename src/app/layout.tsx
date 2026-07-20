import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HaoXue - 好学",
  description: "Ứng dụng học tiếng Trung giao tiếp cá nhân HaoXue",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HaoXue",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans antialiased text-foreground bg-background selection:bg-primary/30">
        <Providers>
          <main className="flex-1 pb-20 overflow-y-auto">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
