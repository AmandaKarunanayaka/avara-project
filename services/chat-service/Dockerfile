# services/chat-service/Dockerfile
FROM node:20-alpine

# Work at repo root inside container
WORKDIR /app

# 1) Copy the whole services folder (so chat-service can import research-service)
COPY services ./services

# 2) Install deps for chat-service
WORKDIR /app/services/chat-service
RUN npm install --production

# 3) Expose chat-service port
EXPOSE 3008

# 4) Start chat-service
CMD ["node", "index.js"]
