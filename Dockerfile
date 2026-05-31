FROM node:24-slim

WORKDIR /app

COPY package*.json /app/

RUN npm ci --omit=dev

COPY *.js /app/

EXPOSE 3000

USER node

CMD ["node", "index.js"]
