// src/actions/instance/create-instance.ts
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { CreateInstanceSchema } from "@/lib/validations";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
}

type CreateInstanceInput = z.infer<typeof CreateInstanceSchema>;

export async function createInstance(input: CreateInstanceInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  const validationResult = CreateInstanceSchema.safeParse(input);

  if (!validationResult.success) {
    console.error("Erro de validação:", validationResult.error.errors);
    return {
      error: validationResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { instanceName } = validationResult.data;

  try {
    console.log(
      `[createInstance] Chamando API para criar instância ${instanceName}...`,
    );

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/instance/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: GLOBAL_API_KEY!,
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          settings: {
            groupsIgnore: true,
          },
        }),
      },
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(
        "Erro ao criar instância na Evolution API:",
        apiResponse.status,
        errorData,
      );
      return {
        error: errorData.message || "Erro ao criar instância na Evolution API.",
      };
    }

    const instanceData = await apiResponse.json();
    console.log("[createInstance] Resposta da API:", instanceData);

    if (
      !instanceData?.instance?.instanceId ||
      !instanceData?.instance?.instanceName
    ) {
      console.error(
        "[createInstance] Resposta da API em formato inesperado:",
        instanceData,
      );
      return { error: "Resposta da API em formato inesperado." };
    }

    await db.insert(instancesTables).values({
      instanceId: instanceData.instance.instanceId,
      userId: userId,
      instanceName: instanceData.instance.instanceName,
      integration: instanceData.instance.integration || "WHATSAPP-BAILEYS",
      status: instanceData.instance.status || "connecting",
      ownerJid: instanceData.instance.ownerJid || null,
      profileName: instanceData.instance.profileName || null,
      profilePicUrl: instanceData.instance.profilePicUrl || null,
      qrcode: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Revalidar o cache da página para mostrar a nova instância
    revalidatePath("/whatsapp/instancia");

    return {
      success: "Instância criada com sucesso!",
      instance: instanceData.instance,
    };
  } catch (error) {
    console.error("Erro inesperado ao criar instância:", error);
    return { error: "Ocorreu um erro inesperado ao criar a instância." };
  }
}
