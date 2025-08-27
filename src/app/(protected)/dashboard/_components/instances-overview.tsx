// src/app/(protected)/dashboard/_components/instances-overview.tsx
"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Eye,
  MoreHorizontal,
  Power,
  QrCode,
  Settings,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Instance {
  id: string;
  instanceName: string;
  status: string | null;
  profileName?: string | null;
  profilePicUrl?: string | null;
  phoneNumber?: string | null;
}

interface InstancesOverviewProps {
  instances: Instance[];
}

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case "open":
    case "online":
      return {
        icon: Wifi,
        label: "Online",
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        dotColor: "bg-emerald-500",
      };
    case "connecting":
    case "start":
      return {
        icon: Activity,
        label: "Conectando",
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        dotColor: "bg-amber-500",
      };
    case "qrcode":
      return {
        icon: QrCode,
        label: "QR Code",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        dotColor: "bg-blue-500",
      };
    case "close":
    case "offline":
      return {
        icon: WifiOff,
        label: "Offline",
        className: "bg-red-500/10 text-red-600 border-red-500/20",
        dotColor: "bg-red-500",
      };
    default:
      return {
        icon: WifiOff,
        label: "Desconhecido",
        className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
        dotColor: "bg-gray-500",
      };
  }
};

export function InstancesOverview({ instances }: InstancesOverviewProps) {
  if (instances.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Suas Instâncias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <Smartphone className="text-muted-foreground h-6 w-6" />
              </div>
              <h3 className="mb-2 font-medium">Nenhuma instância encontrada</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Conecte sua primeira instância do WhatsApp para começar
              </p>
              <Link href="/whatsapp">
                <Button variant="magic" >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Conectar WhatsApp
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Suas Instâncias
            </CardTitle>
            <Link href="/whatsapp">
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instances.map((instance, index) => {
              const statusConfig = getStatusConfig(instance.status);
              const StatusIcon = statusConfig.icon;
              // Garantir key única usando combinação de id, instanceName e index
              const uniqueKey =
                instance.id || `${instance.instanceName}-${index}`;

              return (
                <motion.div
                  key={uniqueKey}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  className="hover:bg-muted/50 group flex items-center gap-3 rounded-lg border p-3 transition-all duration-200"
                >
                  {/* Avatar com status */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={instance.profilePicUrl || undefined}
                        alt={instance.profileName || instance.instanceName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {instance.profileName
                          ? instance.profileName.charAt(0).toUpperCase()
                          : instance.instanceName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "border-background absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2",
                        statusConfig.dotColor,
                      )}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium">
                        {instance.profileName || instance.instanceName}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusConfig.className)}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-muted-foreground truncate text-xs">
                        {instance.phoneNumber || instance.instanceName}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/whatsapp?instance=${instance.instanceName}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Power className="mr-2 h-4 w-4" />
                        Reiniciar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })}
          </div>

          {/* Call to action se tiver poucas instâncias */}
          {instances.length < 3 && (
            <motion.div
              key="cta-add-instance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="mt-4 rounded-lg border border-dashed p-3"
            >
              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm">
                  Adicione mais instâncias para aumentar sua capacidade de envio
                </p>
                <Link href="/whatsapp">
                  <Button variant="outline" size="sm">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Adicionar Instância
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
