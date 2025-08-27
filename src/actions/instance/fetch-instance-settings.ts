// src/actions/instance/fetch-instance-settings.ts
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

type FetchInstanceSettingsInput = z.infer<typeof InstanceNameSchema>;

export async function fetchInstanceSettings(input: FetchInstanceSettingsInput) {
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
      "[fetchInstanceSettings] Erro de validação:",
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
      `[fetchInstanceSettings] Instância ${instanceName} não encontrada para o usuário ${userId}.`,
    );
    return { error: "Instância não encontrada." };
  }

  try {
    console.log(
      `[fetchInstanceSettings] Buscando configurações para ${instanceName}...`,
    );

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/settings/find/${instanceName}`,
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
        `[fetchInstanceSettings] Erro na resposta da API para ${instanceName}:`,
        apiResponse.status,
        errorData,
      );

      return {
        error: errorData.message || "Erro ao buscar configurações da instância.",
      };
    }

    const settingsData = await apiResponse.json();
    console.log(
      `[fetchInstanceSettings] Configurações recebidas para ${instanceName}:`,
      settingsData,
    );

    return {
      success: true,
      settings: settingsData,
    };
  } catch (error) {
    console.error(
      `[fetchInstanceSettings] Erro inesperado ao buscar configurações da instância ${instanceName}:`,
      error,
    );
    return { error: "Ocorreu um erro inesperado ao buscar as configurações." };
  }
}
