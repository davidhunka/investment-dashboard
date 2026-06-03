# Use Node.js slim base image for fast builds and lightweight containers
FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy dependency definition files
COPY package.json package-lock.json* ./

# Install production and development dependencies (needed for compilation)
RUN npm install

# Copy all source files
COPY . .

# Build the Vite React production bundle into /dist
RUN npm run build

# Clean up dev dependencies to keep the image slim
RUN npm prune --production

# Keboola Data Apps require port 8080 to be exposed
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Start our unified Express server
CMD ["npm", "start"]
