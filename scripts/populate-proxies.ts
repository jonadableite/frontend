// scripts/populate-proxies.ts
import { db } from "../src/db";
import { proxiesTables } from "../src/db/schema";

// Função para gerar todos os proxies da porta 10000 até 10306
function generateProxies() {
  const proxies = [];
  const host = "res.proxy-seller.com";
  const username = "650f473849737f47";
  const password = "ORj4qA20";

  for (let port = 10000; port <= 10306; port++) {
    proxies.push({
      host,
      port: port.toString(),
      username,
      password,
    });
  }

  return proxies;
}

const PROXIES_DATA = generateProxies();

async function populateProxies() {
  try {
    console.log("Iniciando população de proxies...");
    console.log(`Total de proxies a serem inseridos: ${PROXIES_DATA.length}`);

    const proxiesToInsert = PROXIES_DATA.map((proxy, index) => ({
      id: `proxy_${Date.now()}_${index}`,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      protocol: "socks5",
      isUsed: false,
      assignedInstanceName: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(proxiesTables).values(proxiesToInsert);

    console.log(`✅ ${PROXIES_DATA.length} proxies foram adicionados com sucesso!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Host: ${PROXIES_DATA[0].host}`);
    console.log(`   - Portas: ${PROXIES_DATA[0].port} até ${PROXIES_DATA[PROXIES_DATA.length - 1].port}`);
    console.log(`   - Protocolo: SOCKS5`);
    console.log(`   - Usuário: ${PROXIES_DATA[0].username}`);
  } catch (error) {
    console.error("❌ Erro ao popular proxies:", error);
  } finally {
    process.exit(0);
  }
}

populateProxies();