// src/app/layout.tsx
import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ThemedToaster } from "@/components/themed-toaster";
import { ReactQueryProvider } from "@/providers/react-query";
import { ThemeProvider } from "@/providers/theme-provider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatLead",
  description: "Plataforma de WhatsApp para empresas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="saas-theme"
        >
          <ReactQueryProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </ReactQueryProvider>
        </ThemeProvider>
        <ThemedToaster />
      </body>
    </html>
  );
}
