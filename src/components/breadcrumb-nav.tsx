// src/components/breadcrumb-nav.tsx
"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  whatsapp: "WhatsApp",
  campaigns: "Campanhas",
  agents: "Agentes IA",
  analytics: "Analytics",
  settings: "Configurações",
  instances: "Instâncias",
  messages: "Mensagens",
  contacts: "Contatos",
  scheduled: "Agendadas",
  templates: "Templates",
  create: "Criar",
  training: "Treinamento",
  conversions: "Conversões",
  engagement: "Engagement",
  integrations: "Integrações",
  api: "API",
  webhooks: "Webhooks",
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Remove o primeiro segmento se for uma rota protegida vazia
  const pathSegments = segments.filter(segment => segment !== "(protected)")

  if (pathSegments.length <= 1) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Início
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const href = "/" + pathSegments.slice(0, index + 1).join("/")
          const isLast = index === pathSegments.length - 1
          const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

          return (
            <div key={segment} className="flex items-center">
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
