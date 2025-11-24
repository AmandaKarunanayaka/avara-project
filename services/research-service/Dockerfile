FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3004
ENV PORT=3004 \
    NODE_ENV=production
CMD ["node", "index.js"]
