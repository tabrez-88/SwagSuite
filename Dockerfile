# Multi-stage build untuk optimasi ukuran image

# Stage 1: Build aplikasi
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies untuk build tools
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install semua dependencies (termasuk devDependencies untuk build)
RUN npm install --legacy-peer-deps

# Copy semua source code
COPY . .

# Build frontend dan backend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install dependencies untuk production dan runtime
RUN apk add --no-cache wget curl

# Copy package files
COPY package*.json ./

# Install hanya production dependencies
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy built files dari builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/shared ./shared

# Juga copy server files yang diperlukan untuk imports
COPY --from=builder /app/server ./server

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Set REPL_ID untuk trigger local dev mode (username/password auth)
ENV REPL_ID=

# User non-root untuk keamanan
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port yang digunakan Cloud Run
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start aplikasi
CMD ["node", "dist/index.js"]
