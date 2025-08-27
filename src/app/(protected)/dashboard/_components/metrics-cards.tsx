// src/app/(protected)/dashboard/_components/metrics-cards.tsx
"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsCardsProps {
  instances: {
    total: number;
    active: number;
    connecting: number;
    offline: number;
  };
  metrics: {
    totalMessages: number;
    messagesGrowth: number;
    deliveryRate: number;
    deliveryGrowth: number;
    campaignsActive: number;
    campaignsGrowth: number;
    contactsReached: number;
    contactsGrowth: number;
  };
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  index,
  formatter = (v: number) => v.toString(),
}: {
  title: string;
  value: number;
  change: number;
  icon: any;
  index: number;
  formatter?: (value: number) => string;
}) => {
  const isPositive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group hover:shadow-primary-foreground/20 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
        <div className="bg-primary-foreground/5 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />{" "}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {title}
          </CardTitle>
          <div className="bg-primary/10 rounded-lg p-2">
            <Icon className="text-primary h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <motion.div
                className="text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
              >
                {formatter(value)}
              </motion.div>
              <div className="text-muted-foreground mt-1 flex items-center text-xs">
                {isPositive ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span
                  className={isPositive ? "text-emerald-600" : "text-red-600"}
                >
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
                <span className="ml-1">vs mês anterior</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function MetricsCards({ instances, metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Mensagens Enviadas",
      value: metrics.totalMessages,
      change: metrics.messagesGrowth,
      icon: MessageCircle,
      formatter: (v: number) => v.toLocaleString(),
    },
    {
      title: "Taxa de Entrega",
      value: metrics.deliveryRate,
      change: metrics.deliveryGrowth,
      icon: CheckCircle,
      formatter: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      title: "Instâncias Ativas",
      value: instances.active,
      change: 0,
      icon: Activity,
      formatter: (v: number) => `${v}/${instances.total}`,
    },
    {
      title: "Contatos Alcançados",
      value: metrics.contactsReached,
      change: metrics.contactsGrowth,
      icon: Users,
      formatter: (v: number) => v.toLocaleString(),
    },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <MetricCard
          key={card.title}
          title={card.title}
          value={card.value}
          change={card.change}
          icon={card.icon}
          index={index}
          formatter={card.formatter}
        />
      ))}
    </div>
  );
}
