// src/app/(protected)/dashboard/_components/quick-actions.tsx
"use client";

import { motion } from "framer-motion";
import { BarChart3, MessageSquare, Plus, Send, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  {
    title: "Nova Instância",
    description: "Conectar WhatsApp",
    icon: Plus,
    href: "/whatsapp",
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  },
  {
    title: "Enviar Mensagem",
    description: "Disparo rápido",
    icon: Send,
    href: "/messages/send",
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
  {
    title: "Campanhas",
    description: "Gerenciar campanhas",
    icon: MessageSquare,
    href: "/campaigns",
    color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
  },
  {
    title: "Relatórios",
    description: "Ver analytics",
    icon: BarChart3,
    href: "/reports",
    color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            >
              <Link href={action.href}>
                <Button
                  variant="ghost"
                  className="group h-auto w-full justify-start p-4 transition-all duration-300 hover:shadow-md"
                >
                  <div
                    className={`mr-3 rounded-lg p-2 transition-colors ${action.color}`}
                  >
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{action.title}</div>
                    <div className="text-muted-foreground group-hover:text-foreground text-xs transition-colors">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
