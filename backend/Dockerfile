FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy backend source
COPY . ./

# Expose port 3000
EXPOSE 3000

# Health check - verify API is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Set environment
ENV NODE_ENV=production

# Start backend server
CMD ["node", "test-server.js"]
