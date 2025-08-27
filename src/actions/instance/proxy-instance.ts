// src/actions/instance/proxy-instance.ts
"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

async function fetchEvolutionApi(
  method: string,
  path: string,
  body?: any,
): Promise<any> {
  const API_DOMAIN = process.env.EVOLUTION_API_BASE_URL;
  const API_KEY = process.env.GLOBAL_API_KEY;

  if (!API_DOMAIN || !API_KEY) {
    throw new Error("Evolution API domain or key not configured.");
  }

  const url = `${API_DOMAIN}${path}`;
  const headers = {
    "Content-Type": "application/json",
    apikey: API_KEY,
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store", // Garante dados frescos
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error(
        `API Error (${response.status} ${response.statusText}):`,
        data,
      );
      throw new Error(data.message || `API error: ${response.statusText}`);
    }
    return data;
  } catch (error: any) {
    console.error("Error calling Evolution API:", error);
    throw new Error(`Failed to connect to API: ${error.message}`);
  }
}

// Novo tipo para detalhes do proxy
export type ProxyDetails = {
  enabled: boolean;
  host?: string; // Tornar opcional, pois pode não ser enviado se enabled for false
  port?: string; // Tornar opcional
  protocol?: "http" | "https" | "socks4" | "socks5"; // Tornar opcional
  username?: string;
  password?: string;
};

export async function setInstanceProxy({
  instanceName,
  proxyDetails,
}: {
  instanceName: string;
  proxyDetails: ProxyDetails;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  try {
    // Primeiro, verifique se a instância existe no seu DB e pertence ao usuário logado
    const instance = await db.query.instancesTables.findFirst({
      where: and(
        eq(instancesTables.instanceName, instanceName),
        eq(instancesTables.userId, userId),
      ),
    });

    if (!instance) {
      return {
        success: false,
        error: "Instância não encontrada ou não pertence ao usuário.",
      };
    }

    // A API espera que 'port' seja uma string, mas o tipo ProxyDetails usa string.
    // Certifique-se de que a porta seja uma string se for um número.
    const bodyToSend = {
      ...proxyDetails,
      port: proxyDetails.port ? String(proxyDetails.port) : undefined,
    };

    // Chame a Evolution API para configurar o proxy
    await fetchEvolutionApi("POST", `/proxy/set/${instanceName}`, bodyToSend);

    revalidatePath("/whatsapp/instancia");

    return { success: true, message: "Proxy configurado com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao configurar proxy:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao configurar proxy.",
    };
  }
}

export async function findInstanceProxy({
  instanceName,
}: {
  instanceName: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  try {
    // Primeiro, verifique se a instância existe no DB e pertence ao usuário logado
    const instance = await db.query.instancesTables.findFirst({
      where: and(
        eq(instancesTables.instanceName, instanceName),
        eq(instancesTables.userId, userId),
      ),
    });

    if (!instance) {
      return {
        success: false,
        error: "Instância não encontrada ou não pertence ao usuário.",
      };
    }

    const apiResponse = await fetchEvolutionApi(
      "GET",
      `/proxy/find/${instanceName}`,
    );

    return { success: true, proxy: apiResponse };
  } catch (error: any) {
    console.error("Erro ao buscar proxy:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao buscar proxy.",
    };
  }
}
