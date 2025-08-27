// src/actions/instance/set-presence.ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SetPresenceSchema } from "@/lib/validations";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
}

type SetPresenceInput = z.infer<typeof SetPresenceSchema>;

export async function setInstancePresence(input: SetPresenceInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  // Validação com Zod
  const validationResult = SetPresenceSchema.safeParse(input);

  if (!validationResult.success) {
    console.error("Erro de validação:", validationResult.error.errors);
    return {
      error: validationResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { instanceName, presence } = validationResult.data;

  // Verificar se a instância pertence ao usuário logado
  const instance = await db.query.instancesTables.findFirst({
    where:
      eq(instancesTables.userId, userId) &&
      eq(instancesTables.instanceName, instanceName),
  });

  if (!instance) {
    console.error(
      `[setInstancePresence] Instância ${instanceName} não encontrada para o usuário ${userId}.`,
    );
    return { error: "Instância não encontrada." };
  }

  try {
    console.log(
      `[setInstancePresence] Chamando API para definir presença de ${instanceName} para ${presence}...`,
    );

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/instance/setPresence/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: GLOBAL_API_KEY!,
        },
        body: JSON.stringify({ presence }),
      },
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(
        `[setInstancePresence] Erro na resposta da API para definir presença de ${instanceName}:`,
        apiResponse.status,
        errorData,
      );
      return {
        error: errorData.message || "Erro ao definir presença da instância.",
      };
    }
    revalidatePath("/whatsapp/instancia");

    return {
      success: `Presença da instância ${instanceName} definida para ${presence}.`,
    };
  } catch (error) {
    console.error(
      `[setInstancePresence] Erro inesperado ao definir presença da instância ${instanceName}:`,
      error,
    );
    return { error: "Ocorreu um erro inesperado ao definir a presença." };
  }
}
