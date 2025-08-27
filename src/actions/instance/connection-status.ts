// src/actions/instance/connection-status.ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { setInstanceProxy } from "@/actions/instance";
import { assignUnusedProxy, releaseProxy } from "@/actions/proxy";
import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InstanceNameSchema } from "@/lib/validations";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
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

  // Validação com Zod
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

  // Verificar se a instância pertence ao usuário logado
  const instance = await db.query.instancesTables.findFirst({
    where:
      eq(instancesTables.userId, userId) &&
      eq(instancesTables.instanceName, instanceName),
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

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/instance/connectionState/${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: GLOBAL_API_KEY!,
        },
        cache: "no-store",
      },
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(
        `[getInstanceStatus] Erro na resposta da API para ${instanceName}:`,
        apiResponse.status,
        errorData,
      );

      await db
        .update(instancesTables)
        .set({ status: "unknown", updatedAt: new Date() })
        .where(eq(instancesTables.instanceId, instance.instanceId));
      revalidatePath("/whatsapp/instancia");

      return {
        error: errorData.message || "Erro ao buscar status da instância.",
      };
    }

    const statusData = await apiResponse.json();
    console.log(
      `[getInstanceStatus] Dados de status recebidos da API para ${instanceName}:`,
      statusData,
    );

    const newStatus = statusData.instance?.state;

    if (typeof newStatus !== "string") {
      console.warn(
        `[getInstanceStatus] Propriedade 'instance.state' não encontrada ou não é string na resposta da API para ${instanceName}. Dados recebidos:`,
        statusData,
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

    // Atualizar o status no banco de dados SOMENTE se for diferente
    if (instance.status !== newStatus) {
      await db
        .update(instancesTables)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(instancesTables.instanceId, instance.instanceId));
      revalidatePath("/whatsapp");
    }

    // LÓGICA DE ATRIBUIÇÃO AUTOMÁTICA DE PROXY
    // Se o status for "open" e a instância não tiver proxy configurado, atribuir automaticamente
    if (newStatus === "open") {
      console.log(
        `[getInstanceStatus] Instância ${instanceName} está conectada. Verificando se precisa de proxy...`,
      );

      try {
        // Verificar se a instância já tem proxy configurado
        const proxyResponse = await fetch(
          `${EVOLUTION_API_BASE_URL}/proxy/find/${instanceName}`,
          {
            method: "GET",
            headers: {
              apikey: GLOBAL_API_KEY!,
            },
            cache: "no-store",
          },
        );

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();

          // Se não há proxy configurado ou está desabilitado, atribuir um novo
          if (!proxyData.enabled) {
            console.log(
              `[getInstanceStatus] Instância ${instanceName} não tem proxy configurado. Atribuindo automaticamente...`,
            );

            // Atribuir proxy não utilizado
            const proxyAssignment = await assignUnusedProxy(instanceName);

            if (proxyAssignment.success && proxyAssignment.proxy) {
              console.log(
                `[getInstanceStatus] Proxy atribuído com sucesso para ${instanceName}:`,
                proxyAssignment.proxy,
              );

              // Configurar o proxy na Evolution API
              const proxyDetails = {
                enabled: true,
                host: proxyAssignment.proxy.host,
                port: proxyAssignment.proxy.port,
                protocol: proxyAssignment.proxy.protocol,
                username: proxyAssignment.proxy.username,
                password: proxyAssignment.proxy.password,
              };

              const setProxyResult = await setInstanceProxy({
                instanceName,
                proxyDetails,
              });

              if (setProxyResult.success) {
                console.log(
                  `[getInstanceStatus] Proxy configurado com sucesso na Evolution API para ${instanceName}`,
                );
              } else {
                console.error(
                  `[getInstanceStatus] Erro ao configurar proxy na Evolution API para ${instanceName}:`,
                  setProxyResult.error,
                );

                // Se falhar ao configurar na API, liberar o proxy
                await releaseProxy(instanceName);
              }
            } else {
              console.warn(
                `[getInstanceStatus] Não foi possível atribuir proxy para ${instanceName}:`,
                proxyAssignment.error,
              );
            }
          } else {
            console.log(
              `[getInstanceStatus] Instância ${instanceName} já tem proxy configurado.`,
            );
          }
        } else {
          console.warn(
            `[getInstanceStatus] Não foi possível verificar proxy da instância ${instanceName}.`,
          );
        }
      } catch (proxyError) {
        console.error(
          `[getInstanceStatus] Erro ao verificar/configurar proxy para ${instanceName}:`,
          proxyError,
        );
      }
    }

    const returnObject = { success: true, status: newStatus };
    console.log(
      `[getInstanceStatus] Retornando objeto para o cliente:`,
      returnObject,
    );
    return returnObject;
  } catch (error) {
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
