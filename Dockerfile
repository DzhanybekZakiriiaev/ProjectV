FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production \
    PORT=3100

EXPOSE 3100

CMD ["npm", "run", "start"]

