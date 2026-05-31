# Dockerfile do FRONTEND PromoVideo — Vite build → Nginx serve estático
# Mesma estrutura do frontend PromoPage, com nginx config própria.
#
# Build: docker build -t promovideo-web ./frontend
# Run:   docker run -d -p 8081:80 promovideo-web
#
# Em produção: roda atrás do Caddy (videos.promopage.com.br → :8081 → :80 do container)

# ---- Stage 1: build do Vite ----
FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Vite gera assets otimizados em /app/dist
RUN npm run build

# ---- Stage 2: Nginx servindo dist + proxy reverso pro backend ----
FROM nginx:1.27-alpine

# Remove config default
RUN rm /etc/nginx/conf.d/default.conf

# Config custom: SPA fallback (qualquer rota → index.html) + proxy /api e /out → backend
COPY nginx.conf /etc/nginx/conf.d/promovideo.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
