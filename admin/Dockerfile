# Stage 1: Build the React Vite app
FROM node:20-alpine3.20 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to take advantage of Docker cache
COPY package.json  pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile



COPY . .

# Build the app with the /admin/ base path
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
