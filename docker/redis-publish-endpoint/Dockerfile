FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY functions/src/redis-publish-endpoint.js ./
COPY package*.json ./

# Create a minimal package.json if it doesn't exist
RUN echo '{ \
  "name": "redis-publish-endpoint", \
  "version": "1.0.0", \
  "main": "redis-publish-endpoint.js", \
  "scripts": { \
    "start": "node redis-publish-endpoint.js" \
  }, \
  "dependencies": { \
    "express": "^4.18.2", \
    "cors": "^2.8.5", \
    "redis": "^4.6.5", \
    "uuid": "^9.0.0", \
    "jsonwebtoken": "^9.0.0", \
    "jwks-rsa": "^3.0.1" \
  } \
}' > package.json

# Install dependencies
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the application
CMD ["node", "redis-publish-endpoint.js"] 