# Multi-stage build for the complete microservices system

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: API Gateway
FROM node:18-alpine AS api-gateway
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm install --production
COPY services/api-gateway/ .
EXPOSE 3000
CMD ["npm", "start"]

# Stage 3: User Service
FROM node:18-alpine AS user-service
WORKDIR /app
COPY services/user-service/package*.json ./
RUN npm install --production
COPY services/user-service/ .
EXPOSE 3001
CMD ["npm", "start"]

# Stage 4: Booking Service
FROM node:18-alpine AS booking-service
WORKDIR /app
COPY services/booking-service/package*.json ./
RUN npm install --production
COPY services/booking-service/ .
EXPOSE 3002
CMD ["npm", "start"]

# Stage 5: Payment Service
FROM node:18-alpine AS payment-service
WORKDIR /app
COPY services/payment-service/package*.json ./
RUN npm install --production
COPY services/payment-service/ .
EXPOSE 3003
CMD ["npm", "start"]

# Stage 6: Notification Service
FROM node:18-alpine AS notification-service
WORKDIR /app
COPY services/notification-service/package*.json ./
RUN npm install --production
COPY services/notification-service/ .
EXPOSE 3004
CMD ["npm", "start"]

# Stage 7: Frontend serving
FROM nginx:alpine AS frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]