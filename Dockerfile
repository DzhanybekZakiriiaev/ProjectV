FROM node:20-alpine AS base

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy application source
COPY src ./src

# Copy scripts (for admin user creation, seeding)
COPY scripts ./scripts

# Set environment variables
ENV NODE_ENV=production \
    PORT=3100

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl --fail http://localhost:3100/health || exit 1

# Start the application
CMD ["npm", "run", "start"]

