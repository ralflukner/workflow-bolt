# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 8080

# Start the service
CMD [ "npm", "start" ] 