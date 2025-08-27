// src/actions/dashboard/get-dashboard-data.ts
"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- Definições de Tipos ---
// Idealmente, estes tipos estariam em um arquivo separado como src/types/dashboard.ts
// e seriam importados aqui e nos componentes que os utilizam (e.g., RecentActivity, InstancesOverview).

type ActivityStatus = "error" | "success" | "warning" | "info";

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  status: ActivityStatus;
}

// Tipo inferido diretamente do esquema Drizzle para as instâncias do banco de dados
type DbInstance = typeof instancesTables.$inferSelect;

// Tipo esperado pelo componente InstancesOverview
// Assumimos que ele espera 'id' em vez de 'instanceId'
interface InstanceForOverview {
  id: string; // Mapeado de instanceId
  instanceId: string; // O ID real do banco de dados
  userId: string;
  instanceName: string;
  integration: string;
  status: string; // Se o status da instância também tiver um tipo de união, ajuste aqui
  ownerJid: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
  qrcode: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // Adicione outras propriedades que você usa do seu esquema instancesTables
}
// --- Fim das Definições de Tipos ---

export async function getDashboardData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  try {
    // Buscar todas as instâncias do usuário
    const instances: DbInstance[] = await db
      .select()
      .from(instancesTables)
      .where(eq(instancesTables.userId, userId));

    // Calcular métricas básicas
    const totalInstances = instances.length;
    const activeInstances = instances.filter(
      (instance) => instance.status === "open" || instance.status === "online",
    ).length;
    const connectingInstances = instances.filter(
      (instance) =>
        instance.status === "connecting" ||
        instance.status === "qrcode" ||
        instance.status === "start",
    ).length;
    const offlineInstances = instances.filter(
      (instance) =>
        instance.status === "close" || instance.status === "offline",
    ).length;

    // Dados simulados para demonstração (substituir por dados reais posteriormente)
    const mockData = {
      totalMessages: 1250,
      messagesGrowth: 12.5,
      deliveryRate: 94.2,
      deliveryGrowth: 2.1,
      campaignsActive: 3,
      campaignsGrowth: 0,
      contactsReached: 892,
      contactsGrowth: 8.7,
    };

    // Dados para gráficos (mock data)
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split("T")[0],
        messages: Math.floor(Math.random() * 200) + 50,
        delivered: Math.floor(Math.random() * 180) + 40,
        failed: Math.floor(Math.random() * 20) + 5,
      };
    });

    // Atividades recentes (mock data) - Explicitamente tipado como Activity[]
    const recentActivities: Activity[] = [
      {
        id: 1,
        type: "message",
        title: "Campanha 'Black Friday' enviada",
        description: "150 mensagens enviadas com sucesso",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
        status: "success",
      },
      {
        id: 2,
        type: "instance",
        title: "Instância 'Vendas' conectada",
        description: "Conectado com sucesso ao WhatsApp",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
        status: "success",
      },
      {
        id: 3,
        type: "warning",
        title: "Limite de mensagens atingido",
        description: "Instância 'Suporte' pausada temporariamente",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h atrás
        status: "warning",
      },
      {
        id: 4,
        type: "campaign",
        title: "Nova campanha criada",
        description: "Campanha 'Newsletter Semanal' programada",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h atrás
        status: "info",
      },
    ];

    // Mapear instâncias para incluir a propriedade 'id' esperada pelo InstancesOverview
    const instancesList: InstanceForOverview[] = instances
      .slice(0, 5)
      .map((inst) => ({
        ...inst,
        id: inst.instanceId, // Mapeia instanceId para id
      }));

    return {
      success: true,
      data: {
        instances: {
          total: totalInstances,
          active: activeInstances,
          connecting: connectingInstances,
          offline: offlineInstances,
        },
        metrics: mockData,
        chartData,
        recentActivities,
        instancesList, // Usa a lista mapeada
      },
    };
  } catch (error) {
    console.error("[getDashboardData] Erro:", error);
    return {
      success: false,
      error: "Erro ao buscar dados do dashboard",
    };
  }
}
