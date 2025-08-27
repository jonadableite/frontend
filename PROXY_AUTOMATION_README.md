# Sistema de Atribuição Automática de Proxies

Este sistema automatiza a atribuição de proxies para instâncias do WhatsApp (Evolution API) quando elas se conectam (status "open").

## Funcionalidades

- ✅ **Atribuição Automática**: Proxies são atribuídos automaticamente quando uma instância se conecta
- ✅ **Gerenciamento de Pool**: Sistema gerencia um pool de 4000+ proxies
- ✅ **Monitoramento**: Estatísticas em tempo real do uso de proxies
- ✅ **Segurança**: Apenas administradores podem gerenciar proxies

## Como Funciona

### 1. Monitoramento de Status
O sistema monitora continuamente o status das instâncias através da função `getInstanceStatus()`.

### 2. Detecção de Conexão
Quando uma instância muda para status "open", o sistema:
- Verifica se já possui proxy configurado
- Se não possuir, atribui automaticamente um proxy disponível
- Configura o proxy na Evolution API

### 3. Gerenciamento de Pool
- Proxies são marcados como "em uso" quando atribuídos
- Proxies são liberados quando instâncias são desconectadas
- Sistema evita conflitos usando transações de banco

## Configuração

### 1. Banco de Dados
Execute as migrações para criar a tabela `proxies_tables`:

```sql
-- A tabela será criada automaticamente pelo Drizzle
-- Verifique se o schema foi atualizado
```

### 2. Variáveis de Ambiente
Certifique-se de que estas variáveis estão configuradas:

```env
EVOLUTION_API_BASE_URL=https://evo.whatlead.com.br
GLOBAL_API_KEY=429683C4C977415CAAFCCE10F7D57E11
```

### 3. População de Proxies
Execute o script para popular o banco com os proxies:

```bash
# Instalar dependências
npm install

# Executar o script
npx tsx scripts/populate-proxies.ts
```

## Uso

### Atribuição Automática
A atribuição acontece automaticamente. Não é necessário fazer nada manualmente.

### Verificar Estatísticas
Use o componente `ProxyStats` para visualizar estatísticas em tempo real:

```tsx
import { ProxyStats } from "@/components/proxy-stats";

// No seu componente
<ProxyStats />
```

### Gerenciamento Manual (Admin)
Administradores podem usar as funções:

```tsx
import {
  assignUnusedProxy,
  releaseProxy,
  populateProxies,
  getProxyStats
} from "@/actions/proxy";

// Atribuir proxy manualmente
const result = await assignUnusedProxy("minha-instancia");

// Liberar proxy
await releaseProxy("minha-instancia");

// Ver estatísticas
const stats = await getProxyStats();
```

## Estrutura do Banco

### Tabela: proxies_tables
```sql
- id: Identificador único
- host: Endereço do servidor proxy
- port: Porta do proxy
- username: Usuário (se necessário)
- password: Senha (se necessário)
- protocol: Protocolo (http, https, socks4, socks5)
- isUsed: Se está em uso
- assignedInstanceName: Nome da instância que usa
- isActive: Se está ativo
- createdAt: Data de criação
- updatedAt: Data de atualização
```

## Monitoramento

### Logs
O sistema gera logs detalhados para debugging:

```
[getInstanceStatus] Instância Testewhat está conectada. Verificando se precisa de proxy...
[getInstanceStatus] Instância Testewhat não tem proxy configurado. Atribuindo automaticamente...
[getInstanceStatus] Proxy atribuído com sucesso para Testewhat: {...}
[getInstanceStatus] Proxy configurado com sucesso na Evolution API para Testewhat
```

### Métricas
- Total de proxies disponíveis
- Proxies em uso
- Proxies disponíveis
- Percentual de utilização

## Troubleshooting

### Erro: "Nenhum proxy não utilizado disponível"
- Verifique se os proxies foram populados no banco
- Execute o script `populate-proxies.ts`
- Verifique se há proxies ativos

### Erro: "Falha ao configurar proxy na Evolution API"
- Verifique se a Evolution API está funcionando
- Confirme se as credenciais estão corretas
- O proxy será liberado automaticamente em caso de falha

### Proxies não sendo atribuídos
- Verifique os logs do sistema
- Confirme se o status da instância está sendo detectado como "open"
- Verifique se a função `getInstanceStatus` está sendo chamada

## Segurança

- Apenas usuários com role "admin" ou "superadmin" podem gerenciar proxies
- Proxies são isolados por instância
- Transações garantem consistência dos dados
- Logs detalhados para auditoria

## Performance

- Atualização automática a cada 30 segundos
- Cache otimizado com revalidação
- Transações eficientes para evitar deadlocks
- Índices de banco para consultas rápidas