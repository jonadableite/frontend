// src/app/(protected)/dashboard/_components/recent-activity.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Megaphone,
  MessageCircle,
  Smartphone,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  status: "success" | "warning" | "error" | "info";
}

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "message":
      return MessageCircle;
    case "instance":
      return Smartphone;
    case "warning":
      return AlertTriangle;
    case "campaign":
      return Megaphone;
    default:
      return Info;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "success":
      return {
        icon: CheckCircle2,
        color: "text-emerald-600",
        bgColor: "bg-emerald-500/10",
        badgeVariant: "default" as const,
      };
    case "warning":
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        bgColor: "bg-amber-500/10",
        badgeVariant: "secondary" as const,
      };
    case "error":
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-500/10",
        badgeVariant: "destructive" as const,
      };
    default:
      return {
        icon: Info,
        color: "text-blue-600",
        bgColor: "bg-blue-500/10",
        badgeVariant: "outline" as const,
      };
  }
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                const statusConfig = getStatusConfig(activity.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                    className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <div className={`rounded-lg p-2 ${statusConfig.bgColor}`}>
                      <ActivityIcon
                        className={`h-4 w-4 ${statusConfig.color}`}
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          {activity.title}
                        </h4>
                        <StatusIcon
                          className={`h-3 w-3 ${statusConfig.color}`}
                        />
                      </div>

                      <p className="text-muted-foreground text-xs">
                        {activity.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(activity.timestamp, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <Badge
                          variant={statusConfig.badgeVariant}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
