// src/components/nav-projects.tsx
"use client"

import { type LucideIcon, MoreHorizontal } from "lucide-react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface NavProjectsProps {
  projects: {
    name: string
    url: string
    icon: LucideIcon | React.ComponentType<any>
    status?: "active" | "inactive" | "connecting"
  }[]
}

export function NavProjects({ projects }: NavProjectsProps) {
  const { isMobile } = useSidebar()

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500 animate-pulse"
      case "inactive":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Instâncias Ativas</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const IconComponent = item.icon
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link href={item.url} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(item.status)}`} />
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="truncate">{item.name}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">Mais</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <span>Gerenciar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <span>Desconectar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
