# --- ETAPA 1: Compilación ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# --legacy-peer-deps: hay conflictos de peer deps en este proyecto (mismo
# motivo por el que ci-frontend.yml ya instala así). Sin el flag, `npm ci`
# puede toparse con un bug interno del resolver de npm ("Cannot read
# properties of null (reading 'edgesOut')") y el build de Docker falla.
RUN npm ci --legacy-peer-deps

# Copiar todo el código del frontend
COPY . .

# Compilar el proyecto (genera la carpeta /dist)
RUN npm run build

# --- ETAPA 2: Servidor de Producción ---
FROM nginx:1.27-alpine

# Copiar la configuración personalizada de Nginx para soportar SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf

# Copiar los archivos estáticos compilados desde la etapa anterior al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Sin healthcheck, Easypanel/Swarm da por bueno un contenedor cuyo nginx no sirve la aplicación.
# Pide index.html (no la ruta SPA, que siempre cae en index.html): si falta el build, da 404 y el
# contenedor queda "unhealthy" y se reinicia. wget viene con la imagen alpine (busybox).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]