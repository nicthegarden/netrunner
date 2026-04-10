FROM node:18-alpine

WORKDIR /app

# Copy frontend files
COPY index.html ./
COPY js/ ./js/
COPY css/ ./css/
COPY assets/ ./assets/ 2>/dev/null || true

# Install http-server globally
RUN npm install -g http-server@14

# Expose port 8000
EXPOSE 8000

# Health check - verify server is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

# Start http-server with gzip compression
CMD ["http-server", "-p", "8000", "--gzip"]
