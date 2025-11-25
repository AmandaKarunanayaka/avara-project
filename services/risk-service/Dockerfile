FROM node:20-alpine

# Work at repo root inside container
WORKDIR /app

# 1) Copy the whole services folder (so risk-service can import research-service)
COPY services ./services

# 2) Install deps for risk-service
WORKDIR /app/services/risk-service
RUN npm install --production

# 3) Expose risk-service port
EXPOSE 3005

# 4) Start risk-service
CMD ["node", "index.js"]
