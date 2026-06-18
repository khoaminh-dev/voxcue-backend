# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --include=dev

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Copy only production dependencies and built code
COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src ./src

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs
USER nodejs

EXPOSE 5000

# Start the application
CMD ["npm", "start"]
