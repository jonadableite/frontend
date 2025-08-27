// src/components/nav-main.tsx
"use client";

import { motion } from "framer-motion";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon | React.ComponentType<any>;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

interface NavMainProps {
  items: NavItem[];
}

const submenuVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] as const }, // Adicionado 'as const' aqui
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] as const }, // Adicionado 'as const' aqui
  },
};

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SidebarGroupLabel className="text-muted-foreground/80 text-sm font-semibold">
          Menu Principal
        </SidebarGroupLabel>
      </motion.div>

      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/");
          const IconComponent = item.icon;
          const hasSubItems = item.items && item.items.length > 0;

          const commonButtonContent = (
            <>
              {IconComponent && (
                <motion.div
                  className="mr-2"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.15 }}
                >
                  <IconComponent className="h-5 w-5" />
                </motion.div>
              )}
              <span className="whitespace-nowrap transition-colors duration-200">
                {item.title}
              </span>
              {hasSubItems && (
                <ChevronRight
                  className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  } group-data-[state=open]/collapsible:rotate-90`}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute top-0 left-0 h-full w-1 rounded-r-md bg-blue-500 dark:bg-white"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </>
          );

          const motionDivProps = {
            className: `relative flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`,
            whileHover: { scale: 1.01, x: 2 },
            whileTap: { scale: 0.99 },
            transition: { duration: 0.15, ease: "easeInOut" },
          };

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      asChild
                    >
                      <motion.div
                        className={motionDivProps.className}
                        whileHover={motionDivProps.whileHover}
                        whileTap={motionDivProps.whileTap}
                        transition={{ duration: 0.15, ease: "easeInOut" }}
                      >
                        {commonButtonContent}
                      </motion.div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent asChild>
                    <motion.div
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={submenuVariants}
                      style={{ overflow: "hidden" }}
                    >
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <motion.div
                                className={`relative flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                  pathname === subItem.url
                                    ? "bg-secondary text-secondary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.99 }}
                                transition={{
                                  duration: 0.15,
                                  ease: "easeInOut",
                                }}
                              >
                                <Link href={subItem.url} className="flex-grow">
                                  <span className="whitespace-nowrap transition-colors duration-200">
                                    {subItem.title}
                                  </span>
                                </Link>
                                {pathname === subItem.url && (
                                  <motion.div
                                    layoutId="active-sub-nav-indicator"
                                    className="bg-primary absolute top-0 left-0 h-full w-0.5 rounded-r-md dark:bg-white"
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{
                                      duration: 0.2,
                                      ease: "easeOut",
                                    }}
                                  />
                                )}
                              </motion.div>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </motion.div>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          } else {
            // Renderiza como um link direto (ex: Dashboard)
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} className="w-full">
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    asChild
                  >
                    <motion.div
                      className={motionDivProps.className}
                      whileHover={motionDivProps.whileHover}
                      whileTap={motionDivProps.whileTap}
                      transition={{
                        duration: motionDivProps.transition.duration,
                        ease: motionDivProps.transition.ease as any,
                      }}
                    >
                      {commonButtonContent}
                    </motion.div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
