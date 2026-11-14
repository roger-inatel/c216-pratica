# ---------- Estagio 1: build ----------
FROM node:22-alpine AS build

WORKDIR /app

# Copiado antes do codigo para aproveitar o cache de camadas: enquanto o
# package-lock.json nao mudar, o npm ci nao roda de novo.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O Vite grava a URL da API dentro do JavaScript gerado, entao ela precisa
# existir na hora do build, e nao so quando o container sobe.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------- Estagio 2: runtime ----------
# Imagem do nginx que roda sem root, como o backend roda com appuser.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173
