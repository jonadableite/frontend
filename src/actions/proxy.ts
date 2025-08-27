// src/actions/proxy.ts
"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { proxiesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface ProxyAssignmentResult {
  success: boolean;
  proxy?: any;
  error?: string;
}

/**
 * Encontra um proxy não utilizado, o marca como usado e o atribui a uma instância.
 * @param instanceName O nome da instância à qual o proxy será atribuído.
 * @returns Um objeto com o resultado da operação.
 */
export async function assignUnusedProxy(instanceName: string): Promise<ProxyAssignmentResult> {
  try {
    // Usamos uma transação para garantir que a operação seja atômica:
    // encontrar E atualizar o proxy em uma única operação lógica.
    const result = await db.transaction(async (tx) => {
      // Encontra o primeiro proxy não utilizado
      const [unusedProxy] = await tx
        .select()
        .from(proxiesTables)
        .where(and(eq(proxiesTables.isUsed, false), isNull(proxiesTables.assignedInstanceName)))
        .limit(1);

      if (!unusedProxy) {
        // Se não houver proxies disponíveis, faz rollback da transação
        throw new Error("Nenhum proxy não utilizado disponível.");
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
        .returning(); // Retorna o proxy atualizado

      if (!updatedProxy) {
        // Se a atualização falhar por algum motivo (ex: outro processo pegou o proxy), faz rollback
        throw new Error("Falha ao marcar o proxy como usado.");
      }

      return { success: true, proxy: updatedProxy };
    });

    // Revalida o cache da página principal do WhatsApp para refletir a mudança
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
export async function populateProxies(proxies: Array<{
  host: string;
  port: string;
  username: string;
  password: string;
}>) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/authentication");
    }

    // Verifica se o usuário é admin
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return { success: false, error: "Acesso negado. Apenas administradores podem executar esta ação." };
    }

    const proxiesToInsert = proxies.map((proxy, index) => ({
      id: `proxy_${Date.now()}_${index}`,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      protocol: "socks5",
      isUsed: false,
      assignedInstanceName: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(proxiesTables).values(proxiesToInsert);

    return {
      success: true,
      message: `${proxies.length} proxies foram adicionados com sucesso.`
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
      .where(and(eq(proxiesTables.isUsed, false), eq(proxiesTables.isActive, true)));

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