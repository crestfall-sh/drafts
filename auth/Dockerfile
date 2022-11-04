FROM node:18
ENV NODE_ENV=production

WORKDIR /client/
COPY ["./client/package.json", "./package-lock.json", "./"]
RUN npm install --omit=dev
COPY ./client/ ./

WORKDIR /auth/
COPY ["./auth/package.json", "./package-lock.json", "./"]
RUN npm install --omit=dev
COPY ./auth/ ./

WORKDIR /
COPY ./.env ./.env
COPY ./env.mjs ./env.mjs

WORKDIR /auth/
CMD [ "node", "./index.mjs" ]