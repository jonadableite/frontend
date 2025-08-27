// src/actions/instance/update-instance-settings.ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
}

// Schema de validação para as configurações
const InstanceSettingsSchema = z.object({
  instanceName: z.string().min(1, "Nome da instância é obrigatório"),
  rejectCall: z.boolean(),
  msgCall: z.string().optional(),
  groupsIgnore: z.boolean(),
  alwaysOnline: z.boolean(),
  readMessages: z.boolean(),
  syncFullHistory: z.boolean(),
  readStatus: z.boolean(),
});

type UpdateInstanceSettingsInput = z.infer<typeof InstanceSettingsSchema>;

export async function updateInstanceSettings(
  input: UpdateInstanceSettingsInput,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  // Validação com Zod
  const validationResult = InstanceSettingsSchema.safeParse(input);

  if (!validationResult.success) {
    console.error(
      "[updateInstanceSettings] Erro de validação:",
      validationResult.error.errors,
    );
    return {
      error: validationResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { instanceName, ...settings } = validationResult.data;

  // Verificar se a instância pertence ao usuário logado
  const instance = await db.query.instancesTables.findFirst({
    where:
      eq(instancesTables.userId, userId) &&
      eq(instancesTables.instanceName, instanceName),
  });

  if (!instance) {
    console.error(
      `[updateInstanceSettings] Instância ${instanceName} não encontrada para o usuário ${userId}.`,
    );
    return { error: "Instância não encontrada." };
  }

  try {
    console.log(
      `[updateInstanceSettings] Atualizando configurações para ${instanceName}...`,
      settings,
    );

    // Se rejectCall estiver ativo, usar mensagem padrão
    const settingsPayload = {
      ...settings,
      msgCall: settings.rejectCall
        ? "Olá! Não atendo chamadas no WhatsApp. Envie sua mensagem e retorno assim que possível."
        : "",
    };

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/settings/set/${instanceName}`,
      {
        method: "POST",
        headers: {
          apikey: GLOBAL_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsPayload),
      },
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(
        `[updateInstanceSettings] Erro na resposta da API para ${instanceName}:`,
        apiResponse.status,
        errorData,
      );

      return {
        error:
          errorData.message || "Erro ao atualizar configurações da instância.",
      };
    }

    const responseData = await apiResponse.json();
    console.log(
      `[updateInstanceSettings] Configurações atualizadas para ${instanceName}:`,
      responseData,
    );

    revalidatePath("/whatsapp/instancia");

    return {
      success: `Configurações da instância ${instanceName} atualizadas com sucesso.`,
    };
  } catch (error) {
    console.error(
      `[updateInstanceSettings] Erro inesperado ao atualizar configurações da instância ${instanceName}:`,
      error,
    );
    return {
      error: "Ocorreu um erro inesperado ao atualizar as configurações.",
    };
  }
}
