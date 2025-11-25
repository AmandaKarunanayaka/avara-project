FROM node:20-alpine

# Work at repo root inside container
WORKDIR /app

# 1) Copy the whole services folder (so roadmap-service can import research-service)
COPY services ./services

# 2) Install deps for roadmap-service
WORKDIR /app/services/roadmap-service
RUN npm install --production

# 3) Expose roadmap-service port
EXPOSE 3006

# 4) Start roadmap-service
CMD ["node", "index.js"]
