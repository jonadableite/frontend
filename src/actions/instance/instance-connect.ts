// src/actions/instance/instance-connect.ts
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

type InstanceConnectInput = z.infer<typeof InstanceNameSchema>;

export async function getInstanceQrCode(input: InstanceConnectInput) {
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
    console.error("Erro de validação:", validationResult.error.errors);
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
      `[getInstanceQrCode] Instância ${instanceName} não encontrada para o usuário ${userId}.`,
    );
    return { error: "Instância não encontrada." };
  }

  try {
    console.log(
      `[getInstanceQrCode] Chamando API para QR Code de ${instanceName}...`,
    );

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/instance/connect/${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: GLOBAL_API_KEY!,
        },
      },
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(
        `[getInstanceQrCode] Erro na resposta da API para QR Code de ${instanceName}:`,
        apiResponse.status,
        errorData,
      );
      return {
        error: errorData.message || "Erro ao buscar QR Code da instância.",
      };
    }

    const qrCodeData = await apiResponse.json();
    console.log(
      `[getInstanceQrCode] Dados de QR Code recebidos da API para ${instanceName}:`,
      qrCodeData,
    );

    // Verifica se a API retornou apenas count (instância não está pronta)
    if (
      qrCodeData &&
      typeof qrCodeData.count === "number" &&
      qrCodeData.count === 0
    ) {
      console.log(
        `[getInstanceQrCode] Instância ${instanceName} ainda não está pronta para gerar QR Code (count: ${qrCodeData.count})`,
      );
      return {
        error: "Instância ainda não está pronta. Aguarde alguns segundos...",
      };
    }

    // Verifica se temos os dados necessários do QR Code
    if (
      !qrCodeData ||
      (!qrCodeData.code && !qrCodeData.base64 && !qrCodeData.pairingCode)
    ) {
      console.error(
        "[getInstanceQrCode] Resposta da API em formato inesperado:",
        qrCodeData,
      );
      return { error: "Resposta da API em formato inesperado." };
    }

    return {
      success: true,
      qrCode: qrCodeData.base64 || null,
      pairingCode: qrCodeData.pairingCode || null,
    };
  } catch (error) {
    console.error(
      `[getInstanceQrCode] Erro inesperado ao buscar QR Code da instância ${instanceName}:`,
      error,
    );
    return { error: "Ocorreu um erro inesperado ao buscar o QR Code." };
  }
}
