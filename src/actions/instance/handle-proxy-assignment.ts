// src/actions/instance/handle-proxy-assignment.ts
"use server";


import { ProxyDetails, setInstanceProxy } from "@/actions/instance/proxy-instance";
import { assignUnusedProxy, releaseProxy } from "@/actions/proxy";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

// Função auxiliar para chamar a Evolution API (duplicada de proxy-instance.ts, mas manter aqui para auto-suficiência)
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
    cache: "no-store",
  };

  try {
    const response = await fetch(url, options);
    // Se a resposta for 200 OK, mas o corpo for null, json() vai falhar.
    // Precisamos verificar se a resposta é vazia ou null antes de tentar parsear como JSON.
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


/**
 * Lida com a atribuição automática de proxy para uma instância conectada.
 * @param instanceName O nome da instância.
 * @returns true se o proxy foi configurado ou já estava configurado, false em caso de erro.
 */
export async function handleAutomaticProxyAssignment(instanceName: string): Promise<boolean> {
  console.log(`[handleAutomaticProxyAssignment] Verificando proxy para ${instanceName}...`);

  try {
    // 1. Verificar se a instância já tem proxy configurado na Evolution API
    const proxyData = await fetchEvolutionApi(
      "GET",
      `/proxy/find/${instanceName}`,
    );

    // CORREÇÃO AQUI: Verificar se proxyData não é null e se proxyData.enabled é true
    if (proxyData && proxyData.enabled) {
      console.log(`[handleAutomaticProxyAssignment] Instância ${instanceName} já tem proxy configurado e ativo.`);
      return true; // Já tem proxy e está ativo, nada a fazer
    }

    // Se proxyData é null ou proxyData.enabled é false, precisamos atribuir um novo proxy
    console.log(`[handleAutomaticProxyAssignment] Instância ${instanceName} não tem proxy ativo. Atribuindo automaticamente...`);

    // 2. Atribuir um proxy não utilizado do nosso banco de dados
    const proxyAssignment = await assignUnusedProxy(instanceName);

    if (proxyAssignment.success && proxyAssignment.proxy) {
      const assignedProxy = proxyAssignment.proxy;
      console.log(`[handleAutomaticProxyAssignment] Proxy ${assignedProxy.host}:${assignedProxy.port} atribuído no DB para ${instanceName}.`);

      // 3. Configurar o proxy atribuído na Evolution API
      const proxyDetails: ProxyDetails = {
        enabled: true,
        host: assignedProxy.host,
        port: assignedProxy.port, // Já é string
        protocol: assignedProxy.protocol,
        username: assignedProxy.username,
        password: assignedProxy.password,
      };

      const setProxyResult = await setInstanceProxy({ instanceName, proxyDetails });

      if (setProxyResult.success) {
        console.log(`[handleAutomaticProxyAssignment] Proxy configurado com sucesso na Evolution API para ${instanceName}.`);
        return true;
      } else {
        console.error(`[handleAutomaticProxyAssignment] Erro ao configurar proxy na Evolution API para ${instanceName}: ${setProxyResult.error}`);
        // Se a configuração do proxy falhar na Evolution API, liberamos o proxy no nosso DB
        await releaseProxy(instanceName);
        return false;
      }
    } else {
      console.warn(`[handleAutomaticProxyAssignment] Não foi possível atribuir proxy do DB para ${instanceName}: ${proxyAssignment.error}`);
      return false;
    }
  } catch (error) {
    console.error(`[handleAutomaticProxyAssignment] Erro ao processar atribuição automática de proxy para ${instanceName}:`, error);
    return false;
  }
}
