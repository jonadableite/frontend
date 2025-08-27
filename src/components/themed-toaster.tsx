// src/components/themed-toaster.tsx
"use client";

import { useTheme } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

export function ThemedToaster() {
  const { theme } = useTheme();
  const toasterTheme = theme === 'system' ? undefined : (theme as 'light' | 'dark');


  return (
    <Toaster position="bottom-center" richColors theme={toasterTheme} />
  );
}
