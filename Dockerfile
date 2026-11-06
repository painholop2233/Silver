FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite frontend assets
RUN npm run build

# Expose server port (default Cloud Run / Render is 3000 or $PORT)
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Start Express fullstack server with TSX
CMD ["npm", "start"]
