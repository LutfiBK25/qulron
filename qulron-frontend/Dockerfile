
# ---- Build Stage ----
FROM node:22-alpine AS build-stage

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build --prod

# ---- Production Stage ----
FROM nginx:stable-alpine AS production-stage

# Replace default Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy Angular build (detect folder dynamically via dist/*)
COPY --from=build-stage /app/dist/*/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]