FROM node:18

ENV NODE_ENV=production

WORKDIR /app

COPY ./ ./

RUN npm install --omit=dev

RUN npm run studio-build

CMD [ "node", "./server/index.mjs" ]