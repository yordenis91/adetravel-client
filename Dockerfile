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

# Copiar los archivos estáticos compilados desde la etapa anterior al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]