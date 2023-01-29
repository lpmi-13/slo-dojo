FROM node:18-slim

WORKDIR /app

COPY package.json /app

RUN npm i

COPY *.js /app/

EXPOSE 3000

ENTRYPOINT ["node", "index.js"]
