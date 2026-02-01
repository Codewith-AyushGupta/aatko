FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# 🔹 Load env file
COPY .env.production .env.production

RUN npm run build

EXPOSE 3456
CMD ["npx", "next", "start", "-p", "3456", "-H", "0.0.0.0"]
