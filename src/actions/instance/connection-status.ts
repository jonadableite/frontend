// src/actions/instance/connection-status.ts
"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

// Certifique-se de que o caminho para setInstanceProxy e ProxyDetails está correto se ainda forem usados diretamente
// import { setInstanceProxy } from "@/actions/instance/proxy-instance";
import { handleAutomaticProxyAssignment } from "@/actions/instance/handle-proxy-assignment"; // NOVO IMPORT
import { releaseProxy } from "@/actions/proxy"; // Manter para liberar proxy em caso de desconexão
import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InstanceNameSchema } from "@/lib/validations";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
}

// Função auxiliar para chamar a Evolution API (padronizada)
async function fetchEvolutionApi(
  method: string,
  path: string,
  body?: any,
): Promise<any> {
  if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
    console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
    throw new Error("Evolution API domain or key not configured.");
  }

  const url = `${EVOLUTION_API_BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    apikey: GLOBAL_API_KEY,
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  };

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      console.error(
        `API Error (${response.status} ${response.statusText}) for ${url}:`,
        data,
      );
      throw new Error(data?.message || `API error: ${response.statusText}`);
    }
    return data;
  } catch (error: any) {
    console.error(`Error calling Evolution API at ${url}:`, error);
    throw new Error(`Failed to connect to API: ${error.message}`);
  }
}


type GetInstanceStatusInput = z.infer<typeof InstanceNameSchema>;

export async function getInstanceStatus(input: GetInstanceStatusInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  const validationResult = InstanceNameSchema.safeParse(input);

  if (!validationResult.success) {
    console.error(
      "[getInstanceStatus] Erro de validação:",
      validationResult.error.errors,
    );
    return {
      error: validationResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { instanceName } = validationResult.data;

  const instance = await db.query.instancesTables.findFirst({
    where: and(
      eq(instancesTables.userId, userId),
      eq(instancesTables.instanceName, instanceName),
    ),
  });

  if (!instance) {
    console.error(
      `[getInstanceStatus] Instância ${instanceName} não encontrada para o usuário ${userId}.`,
    );
    return { error: "Instância não encontrada." };
  }

  try {
    console.log(
      `[getInstanceStatus] Chamando API para status de ${instanceName}...`,
    );

    const apiResponse = await fetchEvolutionApi(
      "GET",
      `/instance/connectionState/${instanceName}`,
    );

    const newStatus = apiResponse.instance?.state;

    if (typeof newStatus !== "string") {
      console.warn(
        `[getInstanceStatus] Propriedade 'instance.state' não encontrada ou não é string na resposta da API para ${instanceName}. Dados recebidos:`,
        apiResponse,
      );

      await db
        .update(instancesTables)
        .set({ status: "unknown", updatedAt: new Date() })
        .where(eq(instancesTables.instanceId, instance.instanceId));
      revalidatePath("/whatsapp");
      return {
        error: "Formato de resposta da API inesperado.",
      };
    }

    console.log(
      `[getInstanceStatus] Atualizando DB para ${instanceName} com status: ${newStatus}`,
    );

    if (instance.status !== newStatus) {
      await db
        .update(instancesTables)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(instancesTables.instanceId, instance.instanceId));
      revalidatePath("/whatsapp");
    }

    // LÓGICA DE ATRIBUIÇÃO AUTOMÁTICA DE PROXY (agora usando a função auxiliar)
    if (newStatus === "open") {
      await handleAutomaticProxyAssignment(instanceName); // Chamada da nova função
    } else if (newStatus === "close" || newStatus === "disconnected") {
      // Se a instância desconectou, liberar o proxy
      await releaseProxy(instanceName);
    }

    const returnObject = { success: true, status: newStatus };
    console.log(
      `[getInstanceStatus] Retornando objeto para o cliente:`,
      returnObject,
    );
    return returnObject;
  } catch (error: any) {
    console.error(
      `[getInstanceStatus] Erro inesperado ao buscar status da instância ${instanceName}:`,
      error,
    );

    await db
      .update(instancesTables)
      .set({ status: "unknown", updatedAt: new Date() })
      .where(eq(instancesTables.instanceId, instance.instanceId));
    revalidatePath("/whatsapp");
    return { error: "Ocorreu um erro inesperado ao buscar o status." };
  }
}
