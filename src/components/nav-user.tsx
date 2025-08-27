// src/components/nav-user.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

// eslint-disable-next-line simple-import-sort/imports
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Palette,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { User } from "@/db/schema";

interface NavUserProps {
  user: {
    name: User["name"];
    email: User["email"];
    plan: string;
    dailyMessageLimit: User["dailyMessageLimit"] | null | undefined;
    monthlyMessageLimit: User["monthlyMessageLimit"] | null | undefined;
    credits?: number;
    avatar?: string;
  };
  onSignOut?: () => void;
}

export function NavUser({ user, onSignOut }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2">
                  {" "}
                  {/* Container flex para nome e badge */}
                  <span className="truncate font-semibold">{user.name}</span>
                </div>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Seção de Nome e Email do Usuário (dentro do dropdown) */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="border-border bg-muted/20 mx-1 mb-2 flex flex-col items-start rounded-lg border p-2">
              <div className="relative mt-1 overflow-hidden rounded-full p-[1.5px]">
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
                    Plano:
                  </span>
                  <motion.span
                    className="text-primary text-xs font-bold whitespace-nowrap"
                    animate={{
                      scale: [1, 1.01, 1],
                      filter: [
                        "drop-shadow(0px 0px 0px rgba(167, 139, 250, 0))",
                        "drop-shadow(0px 0px 4px rgba(167, 139, 250, 0.4))",
                        "drop-shadow(0px 0px 0px rgba(167, 139, 250, 0))",
                      ],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.8,
                    }}
                  >
                    {user.plan}
                  </motion.span>
                </div>
              </div>
              {/* Adicionado 'w-full' para garantir que os separadores e seções seguintes ocupem a largura total do padding */}
              <DropdownMenuSeparator className="bg-border my-1 w-full" />{" "}
              {/* Separador visual */}
              {/* Seção de Plano */}
              <div className="text-muted-foreground w-full text-xs">
                <p className="mb-1 font-semibold">Limites mensagens</p>
                <div className="flex items-center justify-between py-0.5">
                  <span className="flex items-center gap-1">
                    <img
                      src="/fasterModels.svg"
                      alt="Limite Diário"
                      className="inline-block h-4 w-4"
                    />
                    Limite Diário:
                  </span>
                  <span className="text-foreground font-semibold">
                    {user.dailyMessageLimit === Infinity ||
                      user.dailyMessageLimit === null ||
                      user.dailyMessageLimit === undefined
                      ? "∞"
                      : user.dailyMessageLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="flex items-center gap-1">
                    <img
                      src="/advancedModels.svg"
                      alt="Limite Mensal:"
                      className="inline-block h-4 w-4"
                    />
                    Limite Mensal:
                  </span>
                  <span className="text-foreground font-semibold">
                    {user.monthlyMessageLimit === Infinity ||
                      user.monthlyMessageLimit === null ||
                      user.monthlyMessageLimit === undefined
                      ? "∞"
                      : user.monthlyMessageLimit}
                  </span>
                </div>
              </div>
              {user.credits !== undefined && ( // Exibe os créditos apenas se a propriedade for fornecida
                <>
                  <DropdownMenuSeparator className="bg-border my-1 w-full" />{" "}
                  {/* Separador visual */}
                  <div className="text-muted-foreground w-full text-xs">
                    <p className="mb-1 font-semibold">Recursos Extras</p>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1">
                        <img
                          src="/credits.svg"
                          alt="Créditos"
                          className="inline-block h-4 w-4"
                        />
                        Créditos:
                      </span>
                      <span className="text-foreground font-semibold">
                        {user.credits}
                      </span>
                    </div>

                    <Button
                      onClick={() => router.push("/add-credits")}
                      variant="magic"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 w-full rounded-md px-1 py-1 text-xs font-semibold transition-colors"
                    >
                      Adicionar Créditos
                    </Button>
                  </div>
                </>
              )}
            </div>
            <DropdownMenuSeparator />
            {/* Grupo de Gerenciamento de Conta */}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/conta")}>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Conta
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                Assinatura
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notificações
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    ☀️ Claro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    🌙 Escuro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    💻 Sistema
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Sair da Conta */}
            <DropdownMenuItem
              onClick={onSignOut}
              className="text-red-500 focus:bg-red-100 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-900 dark:focus:text-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
