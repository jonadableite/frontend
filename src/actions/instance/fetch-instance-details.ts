// src/actions/instance/fetch-instance-details.ts
"use server";

import { and, eq } from "drizzle-orm"; // Importar 'and' para combinar condições
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

// Importar a nova função auxiliar para lidar com a atribuição automática de proxy
import { handleAutomaticProxyAssignment } from "@/actions/instance/handle-proxy-assignment";
// Importar releaseProxy para liberar o proxy em caso de desconexão da instância
import { releaseProxy } from "@/actions/proxy";
import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InstanceNameSchema } from "@/lib/validations";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
  // É importante lançar um erro ou lidar com isso de forma mais robusta em produção
  // Por exemplo, desabilitar a funcionalidade ou retornar um erro claro.
}

// Função auxiliar para chamar a Evolution API, padronizada para lidar com respostas null
// Esta função é duplicada em handle-proxy-assignment.ts e proxy-instance.ts para auto-suficiência
// e para evitar dependências circulares ou complexas entre server actions.
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
    cache: "no-store", // Garante dados frescos
  };

  try {
    const response = await fetch(url, options);
    const text = await response.text(); // Lê a resposta como texto
    const data = text ? JSON.parse(text) : null; // Tenta parsear se não for vazio ou null

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


export async function fetchInstanceDetails(input: z.infer<typeof InstanceNameSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  // Validação com Zod
  const validationResult = InstanceNameSchema.safeParse(input);

  if (!validationResult.success) {
    console.error(
      "[fetchInstanceDetails] Erro de validação:",
      validationResult.error.errors,
    );
    return {
      error: validationResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { instanceName } = validationResult.data;

  // Verificar se a instância existe no DB e pertence ao usuário logado
  const instance = await db.query.instancesTables.findFirst({
    where: and( // Usar 'and' para combinar múltiplas condições
      eq(instancesTables.userId, userId),
      eq(instancesTables.instanceName, instanceName),
    ),
  });

  if (!instance) {
    console.error(
      `[fetchInstanceDetails] Instância ${instanceName} não encontrada para o usuário ${userId}.`,
    );
    return { error: "Instância não encontrada." };
  }

  try {
    console.log(
      `[fetchInstanceDetails] Chamando API para detalhes de ${instanceName}...`,
    );

    // Usar a função auxiliar padronizada para chamar a Evolution API
    const apiResponse = await fetchEvolutionApi(
      "GET",
      `/instance/fetchInstances?instanceName=${instanceName}`,
    );

    if (!Array.isArray(apiResponse) || apiResponse.length === 0) {
      console.warn(
        `[fetchInstanceDetails] Resposta da API vazia ou formato inesperado para ${instanceName}:`,
        apiResponse,
      );
      // Atualiza o status da instância para "unknown" no DB local
      await db
        .update(instancesTables)
        .set({ status: "unknown", updatedAt: new Date() })
        .where(eq(instancesTables.instanceId, instance.instanceId));

      return {
        error: "Instância não encontrada na API Evolution ou formato inesperado.",
      };
    }

    const evolutionInstance = apiResponse[0];

    const connectionStatus = evolutionInstance.connectionStatus || "unknown";
    const ownerJid = evolutionInstance.ownerJid || null;
    const profileName = evolutionInstance.profileName || null;
    const profilePicUrl = evolutionInstance.profilePicUrl || null;

    console.log(
      `[fetchInstanceDetails] Atualizando DB para ${instanceName} com dados completos:`,
      {
        status: connectionStatus,
        ownerJid,
        profileName,
        profilePicUrl,
      },
    );

    // Atualizar o banco de dados com todos os dados recebidos da Evolution API
    const [updatedInstance] = await db
      .update(instancesTables)
      .set({
        status: connectionStatus,
        ownerJid,
        profileName,
        profilePicUrl,
        updatedAt: new Date(),
      })
      .where(eq(instancesTables.instanceId, instance.instanceId))
      .returning(); // Retorna a instância atualizada

    // LÓGICA DE ATRIBUIÇÃO AUTOMÁTICA DE PROXY (agora delegada para a função auxiliar)
    if (connectionStatus === "open") {
      console.log(
        `[fetchInstanceDetails] Instância ${instanceName} está conectada. Iniciando verificação/atribuição de proxy...`,
      );
      await handleAutomaticProxyAssignment(instanceName);
    } else if (connectionStatus === "close" || connectionStatus === "disconnected") {
      // Se a instância desconectou, liberar o proxy no nosso DB
      console.log(
        `[fetchInstanceDetails] Instância ${instanceName} desconectada. Liberando proxy...`,
      );
      await releaseProxy(instanceName);
    }

    // Revalida o cache do Next.js para a página de instâncias
    revalidatePath("/whatsapp/instancia");

    console.log(
      `[fetchInstanceDetails] Retornando dados completos para o cliente:`,
      updatedInstance,
    );

    return {
      success: true,
      instance: updatedInstance,
    };
  } catch (error: any) {
    console.error(
      `[fetchInstanceDetails] Erro inesperado ao buscar detalhes da instância ${instanceName}:`,
      error,
    );

    // Em caso de erro, atualiza o status da instância para "unknown" no DB local
    await db
      .update(instancesTables)
      .set({ status: "unknown", updatedAt: new Date() })
      .where(eq(instancesTables.instanceId, instance.instanceId));

    return { error: "Ocorreu um erro inesperado ao buscar os detalhes." };
  }
}
