# Use Node.js LTS as the base image
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for the server
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server source code
COPY server/ ./server/

# Build the server
RUN cd server && npm run build

# Production image
FROM node:20-slim

WORKDIR /app

# Copy built files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Expose port
EXPOSE 5000

# Start from the server directory
WORKDIR /app/server
CMD ["npm", "start"]
