FROM node:20-alpine AS builder

WORKDIR /app

# ----------------------------------------------------------------------
# Adicione ARGs para as variáveis de ambiente que são necessárias no BUILD
# e defina-as como ENV para estarem disponíveis durante o npm run build
# ----------------------------------------------------------------------

# Variáveis para MinIO/S3
ARG S3_ENABLED
ARG S3_ACCESS_KEY
ARG S3_SECRET_KEY
ARG S3_BUCKET
ARG S3_PORT
ARG S3_ENDPOINT
ARG S3_USE_SSL
ARG S3_REGION

ENV S3_ENABLED=$S3_ENABLED
ENV S3_ACCESS_KEY=$S3_ACCESS_KEY
ENV S3_SECRET_KEY=$S3_SECRET_KEY
ENV S3_BUCKET=$S3_BUCKET
ENV S3_PORT=$S3_PORT
ENV S3_ENDPOINT=$S3_ENDPOINT
ENV S3_USE_SSL=$S3_USE_SSL
ENV S3_REGION=$S3_REGION

# Variáveis para Better Auth / NextAuth.js
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GOOGLE_CALLBACK_URL

ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV GOOGLE_CALLBACK_URL=$GOOGLE_CALLBACK_URL

# Outras variáveis que podem ser necessárias no build (ex: DATABASE_URL se usado em migrations no build)
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Variáveis da Evolution API
ARG EVOLUTION_API_BASE_URL
ARG GLOBAL_API_KEY
ENV EVOLUTION_API_BASE_URL=$EVOLUTION_API_BASE_URL
ENV GLOBAL_API_KEY=$GLOBAL_API_KEY

# Variáveis RabbitMQ e Redis
ARG RABBITMQ_URI
ARG CACHE_REDIS_URI
ENV RABBITMQ_URI=$RABBITMQ_URI
ENV CACHE_REDIS_URI=$CACHE_REDIS_URI

# Variável GIT_SHA (se usada em algum lugar no build, como para versionamento)
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

# Copia os arquivos de configuração do pacote
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm ci

# Copia o restante do código da aplicação
COPY . .

# Constrói a aplicação Next.js para produção
RUN npm run build

# Etapa 2: Execução da aplicação Next.js
FROM node:20-alpine AS runner

WORKDIR /app

# Define o ambiente como produção
ENV NODE_ENV production

# ----------------------------------------------------------------------
# Redefina as ENVs aqui para o ambiente de execução.
# Elas virão do ambiente do EasyPanel (ou do Docker run)
# ----------------------------------------------------------------------

# Variáveis para MinIO/S3 (se usadas em runtime)
ENV S3_ENABLED=$S3_ENABLED
ENV S3_ACCESS_KEY=$S3_ACCESS_KEY
ENV S3_SECRET_KEY=$S3_SECRET_KEY
ENV S3_BUCKET=$S3_BUCKET
ENV S3_PORT=$S3_PORT
ENV S3_ENDPOINT=$S3_ENDPOINT
ENV S3_USE_SSL=$S3_USE_SSL
ENV S3_REGION=$S3_REGION

# Variáveis para Better Auth / NextAuth.js (se usadas em runtime)
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV GOOGLE_CALLBACK_URL=$GOOGLE_CALLBACK_URL

# Outras variáveis que podem ser necessárias em runtime
ENV DATABASE_URL=$DATABASE_URL
ENV EVOLUTION_API_BASE_URL=$EVOLUTION_API_BASE_URL
ENV GLOBAL_API_KEY=$GLOBAL_API_KEY
ENV RABBITMQ_URI=$RABBITMQ_URI
ENV CACHE_REDIS_URI=$CACHE_REDIS_URI
ENV GIT_SHA=$GIT_SHA

# Copia apenas o package.json para que o `npm start` funcione
COPY package.json ./

# Copia as dependências de produção do estágio de build
COPY --from=builder /app/node_modules ./node_modules

# Copia a aplicação Next.js construída e os arquivos públicos
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public


EXPOSE 3000

CMD ["npm", "start"]
