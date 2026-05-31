FROM node:18-slim

WORKDIR /app

COPY package*.json /app/

RUN npm ci --omit=dev

COPY *.js /app/

EXPOSE 3000

CMD ["node", "index.js"]
