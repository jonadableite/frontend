// src/app/(protected)/_components/app-sidebar.tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, LayoutDashboard, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FaWhatsapp } from "react-icons/fa";

import Logo from "@/components/logo";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const session = authClient.useSession();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [displayedPlan, setDisplayedPlan] = React.useState("");

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      setDisplayedPlan(session.data?.user?.plan || "");
    }
  }, [session.data?.user?.plan, isMounted]);

  console.log("Sidebar isCollapsed:", isCollapsed);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  // Verifica se o usuário logado possui a role de 'admin'
  const userRoles = session.data?.user?.role || "";
  const isSuperAdmin = userRoles.split(",").includes("superadmin");

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "WhatsApp",
      url: "/whatsapp",
      icon: FaWhatsapp,
      items: [
        {
          title: "Instâncias",
          url: "/whatsapp/instancia",
        },
      ],
    },
  ];

  const userData = {
    name: session.data?.user?.name || "",
    email: session.data?.user?.email || "",
    avatar: session.data?.user?.image || "",
    plan: displayedPlan, // Agora vem do estado 'displayedPlan'
    dailyMessageLimit: session.data?.user?.dailyMessageLimit,
    monthlyMessageLimit: session.data?.user?.monthlyMessageLimit,
  };
  if (!userData.name) {
    userData.name = session.data?.user?.email || "Usuário sem nome";
  }

  return (
    <Sidebar collapsible="icon" className="w-[260px]" {...props}>
      <SidebarHeader>
        <div
          className={`flex items-center ${isCollapsed ? "justify-center p-2" : "gap-3 p-2"}`}
        >
          <AnimatePresence mode="wait">
            {isCollapsed ? (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Logo variant="icon" className="h-8 w-8 min-w-[32px]" />
              </motion.div>
            ) : (
              <motion.div
                key="logo-expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Logo variant="icon" className="h-12 w-12 min-w-[48px]" />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="text-content"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-grow flex-col items-start overflow-hidden"
              >
                <motion.span
                  className="text-foreground text-2xl font-semibold whitespace-nowrap"
                  animate={{
                    scale: [1, 1.01, 1],
                    filter: [
                      "drop-shadow(0px 0px 0px rgba(255, 255, 255, 0))",
                      "drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.4))",
                      "drop-shadow(0px 0px 0px rgba(255, 255, 255, 0))",
                    ],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8,
                  }}
                >
                  WhatLead
                </motion.span>
                <div className="relative mt-1 self-start overflow-hidden rounded-full p-[1.5px]">
                  <motion.div
                    className="absolute inset-0 z-0 rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0%, transparent 60%, #a78bfa 75%, #a78bfa 85%, transparent 100%)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <div className="relative z-10 flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0 backdrop-blur-sm">
                    <span className="text-foreground text-sm font-light">
                      Plano atual:
                    </span>
                    <span className="text-primary text-xs font-bold whitespace-nowrap">
                      {displayedPlan}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/* Novo SidebarGroup para "Outros" e os botões de Upgrade e Super Admin */}
        <SidebarGroup className="mt-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <SidebarGroupLabel className="text-muted-foreground/80 text-sm font-semibold">
              Outros
            </SidebarGroupLabel>
          </motion.div>
          <Link
            href="/subscription"
            className={cn(
              "relative block w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#1e1b4a] to-[#0D0D0D]",
              "group transition-all duration-300 hover:shadow-lg",
              "upgrade-button-shimmer",
              "mt-4",
            )}
          >
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.div
                  key="upgrade-collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center p-3">
                    <Crown className="h-6 w-6 text-yellow-400" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upgrade-expanded"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-3"
                >
                  <Crown className="h-6 w-6 text-yellow-400" />
                  <span className="flex-grow text-sm font-semibold text-white">
                    Upgrade de Plano
                  </span>
                  <Sparkles className="h-4 w-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          {isSuperAdmin && (
            <Link
              href="/admin"
              className={cn(
                "relative block w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-700 to-blue-900",
                "group transition-all duration-300 hover:shadow-lg",
                "mt-2",
              )}
            >
              <AnimatePresence mode="wait">
                {isCollapsed ? (
                  <motion.div
                    key="admin-collapsed"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-center p-3">
                      <Users className="h-6 w-6 text-blue-300" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="admin-expanded"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3"
                  >
                    <Users className="h-6 w-6 text-blue-300" />
                    <span className="flex-grow text-sm font-semibold text-white">
                      Admin
                    </span>
                    <Sparkles className="h-4 w-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onSignOut={handleSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
