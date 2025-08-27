// src/actions/instance/fetch-instance-details.ts
"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InstanceNameSchema } from "@/lib/validations";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
}

type FetchInstanceDetailsInput = z.infer<typeof InstanceNameSchema>;

export async function fetchInstanceDetails(input: FetchInstanceDetailsInput) {
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

  // Verificar se a instância pertence ao usuário logado
  const instance = await db.query.instancesTables.findFirst({
    where:
      eq(instancesTables.userId, userId) &&
      eq(instancesTables.instanceName, instanceName),
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

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/instance/fetchInstances?instanceName=${instanceName}`,
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
        `[fetchInstanceDetails] Erro na resposta da API para ${instanceName}:`,
        apiResponse.status,
        errorData,
      );

      await db
        .update(instancesTables)
        .set({ status: "unknown", updatedAt: new Date() })
        .where(eq(instancesTables.instanceId, instance.instanceId));

      return {
        error: errorData.message || "Erro ao buscar detalhes da instância.",
      };
    }

    const instancesData = await apiResponse.json();
    console.log(
      `[fetchInstanceDetails] Dados recebidos da API para ${instanceName}:`,
      instancesData,
    );

    if (!Array.isArray(instancesData) || instancesData.length === 0) {
      console.warn(
        `[fetchInstanceDetails] Resposta da API vazia ou formato inesperado para ${instanceName}:`,
        instancesData,
      );
      return {
        error: "Instância não encontrada na API Evolution.",
      };
    }

    const evolutionInstance = instancesData[0];

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

    // Atualizar o banco de dados com todos os dados
    const [updatedInstance] = await db
      .update(instancesTables)
      .set({
        status: connectionStatus,
        ownerJid: ownerJid,
        profileName: profileName,
        profilePicUrl: profilePicUrl,
        updatedAt: new Date(),
      })
      .where(eq(instancesTables.instanceId, instance.instanceId))
      .returning();

    const returnObject = {
      success: true,
      instance: updatedInstance,
    };
    console.log(
      `[fetchInstanceDetails] Retornando dados completos para o cliente:`,
      returnObject,
    );
    return returnObject;
  } catch (error) {
    console.error(
      `[fetchInstanceDetails] Erro inesperado ao buscar detalhes da instância ${instanceName}:`,
      error,
    );

    await db
      .update(instancesTables)
      .set({ status: "unknown", updatedAt: new Date() })
      .where(eq(instancesTables.instanceId, instance.instanceId));
    return { error: "Ocorreu um erro inesperado ao buscar os detalhes." };
  }
}
