FROM node:18
ENV NODE_ENV=production

WORKDIR /client/
COPY ["./client/package.json", "./package-lock.json", "./"]
RUN npm install --omit=dev
COPY ./client/ ./

WORKDIR /studio/
COPY ["./studio/package.json", "./package-lock.json", "./"]
RUN npm install --omit=dev
COPY ./studio/ ./

WORKDIR /
COPY ./.env ./.env
COPY ./env.mjs ./env.mjs

WORKDIR /studio/
RUN npm run vite-build
CMD ["node", "./server/index.mjs"]