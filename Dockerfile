# =============================================================================
# AI Chatbot Application - Docker Configuration
# =============================================================================

# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    git \
    curl \
    bash

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN cd server && npm ci --only=production && npm cache clean --force
RUN cd client && npm ci --only=production && npm cache clean --force

# Build client
COPY client/ ./client/
RUN cd client && npm run build

# Copy server files
COPY server/ ./server/

# Create necessary directories
RUN mkdir -p /app/server/logs \
             /app/server/uploads \
             /app/server/ml_training/models \
             /app/server/ml_training/datasets \
             /app/server/ml_training/checkpoints \
             /app/server/temp

# Set permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5005/api/health || exit 1

# Start application
WORKDIR /app/server
CMD ["node", "server.js"]
