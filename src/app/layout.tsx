import type { Metadata } from "next";
import { ReactNode } from "react";

import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { Providers } from "@/components/layout/providers";
import { cn } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tourism Predictor AI",
  description:
    "Predict tourism outcomes across Thailand with interactive insights.",
  icons: {
    icon: "/TID_Logo.png",
    shortcut: "/TID_Logo.png",
    apple: "/TID_Logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <Providers>
          <SidebarWrapper>{children}</SidebarWrapper>
        </Providers>
      </body>
    </html>
  );
}
