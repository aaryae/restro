FROM node:20-alpine3.20 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine3.20 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
ARG NEXT_PUBLIC_POS_URL=http://localhost:7001
ARG NEXT_PUBLIC_TENANT_BASE_DOMAIN=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_POS_URL=$NEXT_PUBLIC_POS_URL
ENV NEXT_PUBLIC_TENANT_BASE_DOMAIN=$NEXT_PUBLIC_TENANT_BASE_DOMAIN
RUN npm run build

FROM node:20-alpine3.20 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV API_PROXY_TARGET=http://api:8080
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/next.config.mjs ./
EXPOSE 3000
CMD ["npm", "start"]
