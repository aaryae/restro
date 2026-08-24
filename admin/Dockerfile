# Stage 1: Build the React Vite app
FROM node:20-alpine3.20 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to take advantage of Docker cache
COPY package.json  pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile



COPY . .

ARG VITE_BACKEND_BASE_URL=http://localhost:8080/api/v1/
ARG VITE_IMAGE_BASE_URL=http://localhost:8080/
ARG VITE_FRONTEND_BASE_URL=http://localhost:7001
ARG VITE_WEBSOCKET_BASE_URL=ws://localhost:8080
ARG VITE_SERVE_URL=http://localhost:3000
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
ENV VITE_IMAGE_BASE_URL=$VITE_IMAGE_BASE_URL
ENV VITE_FRONTEND_BASE_URL=$VITE_FRONTEND_BASE_URL
ENV VITE_WEBSOCKET_BASE_URL=$VITE_WEBSOCKET_BASE_URL
ENV VITE_SERVE_URL=$VITE_SERVE_URL

RUN pnpm run build

# Stage 2: Serve the built app with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /usr/share/nginx/nginx.conf
# Expose port 80 for the Nginx server

EXPOSE 8080

# Nginx uses this file by default
CMD ["nginx", "-g", "daemon off;","-c","/usr/share/nginx/nginx.conf"]
