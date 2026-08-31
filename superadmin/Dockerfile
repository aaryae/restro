# Stage 1: Build
FROM node:20-alpine3.20 AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ARG VITE_POS_URL=http://localhost:7001
ARG VITE_TENANT_BASE_DOMAIN=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_POS_URL=$VITE_POS_URL
ENV VITE_TENANT_BASE_DOMAIN=$VITE_TENANT_BASE_DOMAIN

RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /usr/share/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;", "-c", "/usr/share/nginx/nginx.conf"]
