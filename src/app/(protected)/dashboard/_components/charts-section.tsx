// src/app/(protected)/dashboard/_components/charts-section.tsx
"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartData {
  date: string;
  messages: number;
  delivered: number;
  failed: number;
}

interface ChartsSectionProps {
  chartData: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background rounded-lg border p-3 shadow-lg">
        <p className="mb-2 text-sm font-medium">
          {new Date(label).toLocaleDateString("pt-BR")}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize">{entry.dataKey}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ChartsSection({ chartData }: ChartsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Análise de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="area" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="area">Área</TabsTrigger>
              <TabsTrigger value="bar">Barras</TabsTrigger>
            </TabsList>

            <TabsContent value="area" className="mt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="messagesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="deliveredGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })
                      }
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />

                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#messagesGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#deliveredGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="bar" className="mt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })
                      }
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />

                    <Bar
                      dataKey="messages"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="delivered"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="failed"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-primary h-3 w-3 rounded-full" />
              <span>Enviadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Entregues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Falharam</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
