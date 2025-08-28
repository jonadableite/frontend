// src/actions/instance/proxy-instance.ts
"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

// Função auxiliar para chamar a Evolution API
async function fetchEvolutionApi(
  method: string,
  path: string,
  body?: any,
): Promise<any> {
  const API_DOMAIN = process.env.EVOLUTION_API_BASE_URL;
  const API_KEY = process.env.GLOBAL_API_KEY;

  if (!API_DOMAIN || !API_KEY) {
    console.error("Evolution API domain or key not configured.");
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
    const text = await response.text(); // Lê a resposta como texto
    const data = text ? JSON.parse(text) : null; // Tenta parsear se não for vazio

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

export type ProxyDetails = {
  enabled: boolean;
  host?: string;
  port?: string;
  protocol?: "http" | "https" | "socks4" | "socks5";
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

    // CORREÇÃO AQUI: O corpo da requisição deve ser o próprio objeto proxyDetails
    // se enabled for true, ou { enabled: false } se for para desativar.
    const bodyToSend = proxyDetails.enabled
      ? {
        enabled: true, // Garante que enabled é true se estamos enviando detalhes
        host: proxyDetails.host,
        port: proxyDetails.port,
        protocol: proxyDetails.protocol,
        username: proxyDetails.username,
        password: proxyDetails.password,
      }
      : { enabled: false }; // Para desativar o proxy

    const apiPath = `/proxy/set/${instanceName}`;
    await fetchEvolutionApi("POST", apiPath, bodyToSend);

    revalidatePath("/whatsapp/instancia");

    return { success: true, message: "Proxy configurado com sucesso!" };
  } catch (error: any) {
    console.error(`Erro ao configurar proxy para instância ${instanceName}:`, error);
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

    // apiResponse pode ser null ou um objeto como { enabled: false } ou { enabled: true, ... }
    return { success: true, proxy: apiResponse };
  } catch (error: any) {
    console.error(`Erro ao buscar proxy para instância ${instanceName}:`, error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao buscar proxy.",
    };
  }
}
