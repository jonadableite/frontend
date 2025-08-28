// src/actions/proxy.ts
"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { NewProxy, proxiesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface ProxyAssignmentResult {
  success: boolean;
  proxy?: any; // Melhorar este tipo para Proxy do schema
  error?: string;
}

/**
 * Encontra um proxy não utilizado, o marca como usado e o atribui a uma instância.
 * @param instanceName O nome da instância à qual o proxy será atribuído.
 * @returns Um objeto com o resultado da operação.
 */
export async function assignUnusedProxy(instanceName: string): Promise<ProxyAssignmentResult> {
  // Autenticação removida daqui, pois esta função será chamada internamente por outras Server Actions
  // que já lidam com autenticação ou por um webhook que terá sua própria autenticação (secret).
  // Se esta função for chamada diretamente do cliente, adicione a autenticação de volta.

  try {
    const result = await db.transaction(async (tx) => {
      // Encontra o primeiro proxy não utilizado e não atribuído
      const [unusedProxy] = await tx
        .select()
        .from(proxiesTables)
        .where(and(eq(proxiesTables.isUsed, false), isNull(proxiesTables.assignedInstanceName)))
        .limit(1);

      if (!unusedProxy) {
        return { success: false, error: "Nenhum proxy não utilizado disponível." };
      }

      // Marca o proxy como usado e o associa à instância
      const [updatedProxy] = await tx
        .update(proxiesTables)
        .set({
          isUsed: true,
          assignedInstanceName: instanceName,
          updatedAt: new Date(),
        })
        .where(eq(proxiesTables.id, unusedProxy.id))
        .returning();

      if (!updatedProxy) {
        return { success: false, error: "Falha ao marcar o proxy como usado ou proxy já atribuído." };
      }

      return { success: true, proxy: updatedProxy };
    });

    revalidatePath("/whatsapp");

    return result;
  } catch (error: any) {
    console.error("Erro ao atribuir proxy não utilizado:", error);
    return {
      success: false,
      error: error.message || "Erro interno do servidor durante a atribuição do proxy."
    };
  }
}

/**
 * Libera um proxy que estava atribuído a uma instância.
 * Útil se uma instância for desconectada ou excluída.
 * @param instanceName O nome da instância cujo proxy será liberado.
 * @returns Um objeto com o resultado da operação.
 */
export async function releaseProxy(instanceName: string): Promise<{ success: boolean; error?: string }> {
  // Autenticação removida por ser chamada internamente
  try {
    const [updated] = await db
      .update(proxiesTables)
      .set({
        isUsed: false,
        assignedInstanceName: null,
        updatedAt: new Date(),
      })
      .where(eq(proxiesTables.assignedInstanceName, instanceName))
      .returning();

    if (updated) {
      revalidatePath("/whatsapp");
      return { success: true };
    } else {
      return { success: false, error: "Proxy não encontrado para a instância ou já liberado." };
    }
  } catch (error: any) {
    console.error("Erro ao liberar proxy:", error);
    return { success: false, error: "Erro interno do servidor ao liberar proxy." };
  }
}

/**
 * Popula o banco de dados com a lista de proxies fornecida
 * @param proxies Array de objetos com dados dos proxies
 */
export async function populateProxies(proxiesData: Array<{
  host: string;
  port: string;
  username: string;
  password: string;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  // Apenas admins podem popular proxies, por exemplo
  // if (session.user.role !== "admin" && session.user.role !== "superadmin") {
  //   return { success: false, error: "Não autorizado." };
  // }

  try {
    const proxiesToInsert: NewProxy[] = proxiesData.map((proxy) => ({
      // Se o schema usar serial, o ID será auto-gerado.
      // Se o schema usar text, você precisará garantir a unicidade aqui,
      // por exemplo, usando um UUID ou um hash do host:port.
      id: crypto.randomUUID(), // Gera um UUID para o campo id, necessário para o tipo NewProxy
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      protocol: "socks5",
      isUsed: false,
      assignedInstanceName: null,
      isActive: true,
    }));

    const batchSize = 500;
    for (let i = 0; i < proxiesToInsert.length; i += batchSize) {
      const batch = proxiesToInsert.slice(i, i + batchSize);
      await db.insert(proxiesTables).values(batch);
    }

    return {
      success: true,
      message: `${proxiesData.length} proxies foram adicionados com sucesso.`
    };
  } catch (error: any) {
    console.error("Erro ao popular proxies:", error);
    return {
      success: false,
      error: error.message || "Erro interno do servidor ao popular proxies."
    };
  }
}

/**
 * Obtém estatísticas dos proxies
 */
export async function getProxyStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  try {
    const totalProxies = await db
      .select({ count: proxiesTables.id })
      .from(proxiesTables)
      .where(eq(proxiesTables.isActive, true));

    const usedProxies = await db
      .select({ count: proxiesTables.id })
      .from(proxiesTables)
      .where(and(eq(proxiesTables.isUsed, true), eq(proxiesTables.isActive, true)));

    const availableProxies = await db
      .select({ count: proxiesTables.id })
      .from(proxiesTables)
      .where(and(eq(proxiesTables.isUsed, false), isNull(proxiesTables.assignedInstanceName), eq(proxiesTables.isActive, true)));

    return {
      success: true,
      stats: {
        total: totalProxies.length,
        used: usedProxies.length,
        available: availableProxies.length,
      },
    };
  } catch (error: any) {
    console.error("Erro ao obter estatísticas dos proxies:", error);
    return {
      success: false,
      error: error.message || "Erro interno do servidor ao obter estatísticas."
    };
  }
}
