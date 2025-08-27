// src/app/(protected)/_components/main-content-wrapper.tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

import { useSidebar } from "@/components/ui/sidebar";

export function MainContentWrapper({ children }: { children: ReactNode }) {
  const sidebarContext = useSidebar();
  const isCollapsed = sidebarContext?.state === "collapsed";
  const sidebarWidth = 256;

  return (
    <motion.main
      initial={{ marginLeft: sidebarWidth }}
      animate={{ marginLeft: isCollapsed ? 0 : sidebarWidth }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex min-h-screen flex-1 flex-col"
    >
      {children}
    </motion.main>
  );
}
