FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev && \
    npm install -g ts-node

COPY . .

CMD ["npm", "run", "start"]
