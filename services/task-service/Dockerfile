FROM node:20-alpine

# Work at repo root inside container
WORKDIR /app

# 1) Copy the whole services folder (so task-service can import research-service)
COPY services ./services

# 2) Install deps for task-service
WORKDIR /app/services/task-service
RUN npm install --production

# 3) Expose task-service port
EXPOSE 3007

# 4) Start task-service
CMD ["node", "index.js"]
