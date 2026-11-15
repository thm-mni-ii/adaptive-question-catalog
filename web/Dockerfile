# Production image, built and tested in CI/CD; local web uses npm run dev.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY runtime-config.sh /docker-entrypoint.d/40-aqc-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-aqc-config.sh
EXPOSE 80
